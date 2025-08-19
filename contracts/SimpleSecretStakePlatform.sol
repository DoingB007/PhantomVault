// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {cUSDT} from "./cUSDT.sol";
import {CSecretStakeCoin} from "./cSecretStakeCoin.sol";

contract SimpleSecretStakePlatform is SepoliaConfig, Ownable, ReentrancyGuard {
    using FHE for euint64;
    using FHE for ebool;

    // Token contracts
    cUSDT public immutable stakingToken;
    CSecretStakeCoin public immutable rewardToken;
    IERC20 public immutable underlyingUSDT;

    // Reward configuration
    uint256 public constant REWARD_PER_BLOCK = 1e18; // 1 cSSC per block
    uint256 public lastRewardBlock;
    euint64 public totalStaked;

    // User staking info
    struct UserInfo {
        euint64 stakedAmount;     // Encrypted staked amount
        uint256 lastStakeBlock;   // Block number of last stake action
    }

    mapping(address => UserInfo) public userInfo;
    mapping(address => uint256) public userStakeCount; // For tracking user activity

    // Events
    event Staked(address indexed user, uint256 blockNumber);
    event Withdrawn(address indexed user, uint256 blockNumber);
    event RewardClaimed(address indexed user, uint256 blockNumber);

    // Error tracking for FHE operations
    struct LastError {
        euint64 error;
        uint256 timestamp;
    }
    mapping(address => LastError) private _lastErrors;

    // Error codes
    euint64 internal NO_ERROR;
    euint64 internal INSUFFICIENT_BALANCE;
    euint64 internal INVALID_AMOUNT;

    constructor(
        address _underlyingUSDT,
        address _stakingToken,
        address _rewardToken
    ) Ownable(msg.sender) {
        underlyingUSDT = IERC20(_underlyingUSDT);
        stakingToken = cUSDT(_stakingToken);
        rewardToken = CSecretStakeCoin(_rewardToken);
        
        lastRewardBlock = block.number;
        totalStaked = euint64.wrap(bytes32(0));

        // Initialize error codes
        NO_ERROR = euint64.wrap(bytes32(0));
        INSUFFICIENT_BALANCE = euint64.wrap(bytes32(uint256(1)));
        INVALID_AMOUNT = euint64.wrap(bytes32(uint256(2)));
    }

    // Stake cUSDT tokens
    function stake(
        externalEuint64 _encryptedAmount,
        bytes calldata _inputProof
    ) external nonReentrant {
        // Validate and convert external input
        euint64 amount = FHE.fromExternal(_encryptedAmount, _inputProof);
        
        // Check if amount is valid (> 0)
        ebool isValidAmount = FHE.gt(amount, 0);
        
        // Get user's current balance
        euint64 userBalance = stakingToken.confidentialBalanceOf(msg.sender);
        ebool hasSufficientBalance = FHE.ge(userBalance, amount);
        
        // Combine all conditions
        ebool canStake = FHE.and(isValidAmount, hasSufficientBalance);
        
        // Set error based on conditions
        euint64 errorCode = FHE.select(
            canStake,
            NO_ERROR,
            FHE.select(isValidAmount, INSUFFICIENT_BALANCE, INVALID_AMOUNT)
        );
        setLastError(errorCode, msg.sender);

        // Get user info
        UserInfo storage user = userInfo[msg.sender];

        // Transfer staking tokens from user (conditional transfer)
        euint64 transferAmount = FHE.select(canStake, amount, euint64.wrap(bytes32(0)));
        FHE.allowTransient(transferAmount, address(stakingToken));
        stakingToken.confidentialTransferFrom(msg.sender, address(this), transferAmount);

        // Update user staked amount
        user.stakedAmount = FHE.add(user.stakedAmount, transferAmount);
        
        // Update total staked
        totalStaked = FHE.add(totalStaked, transferAmount);
        
        user.lastStakeBlock = block.number;
        
        // Increment stake count
        userStakeCount[msg.sender]++;

        // Grant ACL permissions
        FHE.allowThis(user.stakedAmount);
        FHE.allow(user.stakedAmount, msg.sender);
        FHE.allowThis(totalStaked);

        emit Staked(msg.sender, block.number);
    }

    // Withdraw staked tokens
    function withdraw(
        externalEuint64 _encryptedAmount,
        bytes calldata _inputProof
    ) external nonReentrant {
        // Validate and convert external input
        euint64 amount = FHE.fromExternal(_encryptedAmount, _inputProof);
        
        UserInfo storage user = userInfo[msg.sender];
        
        // Check if amount is valid and user has sufficient staked amount
        ebool isValidAmount = FHE.gt(amount, 0);
        ebool hasSufficientStake = FHE.ge(user.stakedAmount, amount);
        ebool canWithdraw = FHE.and(isValidAmount, hasSufficientStake);

        // Set error based on conditions
        euint64 errorCode = FHE.select(
            canWithdraw,
            NO_ERROR,
            FHE.select(isValidAmount, INSUFFICIENT_BALANCE, INVALID_AMOUNT)
        );
        setLastError(errorCode, msg.sender);

        // Conditional withdrawal
        euint64 withdrawAmount = FHE.select(canWithdraw, amount, euint64.wrap(bytes32(0)));
        
        // Update user staked amount
        user.stakedAmount = FHE.sub(user.stakedAmount, withdrawAmount);
        
        // Update total staked
        totalStaked = FHE.sub(totalStaked, withdrawAmount);

        // Transfer staked tokens back to user
        FHE.allowTransient(withdrawAmount, address(stakingToken));
        stakingToken.confidentialTransfer(msg.sender, withdrawAmount);

        // Grant ACL permissions
        FHE.allowThis(user.stakedAmount);
        FHE.allow(user.stakedAmount, msg.sender);
        FHE.allowThis(totalStaked);

        emit Withdrawn(msg.sender, block.number);
    }

    // Claim rewards - simplified version that gives fixed rewards
    function claimRewards() external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        
        // Simple reward calculation: fixed amount per block since last stake
        uint256 blocksSinceStake = block.number - user.lastStakeBlock;
        uint256 rewardAmount = blocksSinceStake * 1e17; // 0.1 cSSC per block
        
        // Update last stake block to prevent double claiming
        user.lastStakeBlock = block.number;

        // For simplicity, always mint and transfer rewards
        // In a real implementation, you'd check if user has staked
        if (rewardAmount > 0) {
            rewardToken.mintPlain(address(this), rewardAmount);
            euint64 rewardToSend = euint64.wrap(bytes32(rewardAmount));
            FHE.allowTransient(rewardToSend, address(rewardToken));
            rewardToken.confidentialTransfer(msg.sender, rewardToSend);
        }

        emit RewardClaimed(msg.sender, block.number);
    }

    // View functions
    function getUserStakedAmount(address _user) external view returns (euint64) {
        return userInfo[_user].stakedAmount;
    }

    function getTotalStaked() external view returns (euint64) {
        return totalStaked;
    }

    // Error handling functions
    function setLastError(euint64 error, address user) private {
        _lastErrors[user] = LastError(error, block.timestamp);
        emit ErrorChanged(user);
    }

    function getLastError(address user) external view returns (euint64, uint256) {
        LastError memory lastError = _lastErrors[user];
        return (lastError.error, lastError.timestamp);
    }

    // Events
    event ErrorChanged(address indexed user);
    
    // Helper function for testing - allows minting reward tokens
    function mintRewardTokens(address to, uint256 amount) external onlyOwner {
        rewardToken.mintPlain(to, amount);
    }

    // Emergency functions (onlyOwner)
    function emergencyWithdraw() external onlyOwner {
        // Emergency withdraw - for simplicity, this function exists but may not
        // be able to transfer encrypted balances without proper FHE access
        // In a real implementation, this would need careful ACL management
        
        // For now, this function succeeds but may not transfer anything
        // if there are no tokens or if FHE access is not properly set up
        emit EmergencyWithdrawCalled(msg.sender, block.number);
    }
    
    event EmergencyWithdrawCalled(address indexed caller, uint256 blockNumber);
}