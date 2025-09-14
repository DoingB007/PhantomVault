// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {cUSDT} from "./cUSDT.sol";
import {CSecretStakeCoin} from "./cSecretStakeCoin.sol";
import "hardhat/console.sol";

contract SecretStakePlatform is SepoliaConfig, Ownable, ReentrancyGuard {
    using FHE for euint64;
    using FHE for ebool;

    // Token contracts
    cUSDT public immutable stakingToken;
    CSecretStakeCoin public immutable rewardToken;

    // 奖励与计量（简化模型）：
    // - 6 位小数的代币单位
    // - 每 10,000 USDT（基数单位 10_000 * 1e6）每天产出 1 cSSC（1e6）
    uint256 public constant UNIT = 10_000 * 1e6; // 10,000 USDT 对应的最小单位数
    uint256 public constant REWARD_PER_UNIT_PER_DAY = 1e6; // 每单位每天产 1 cSSC
    uint256 public constant DAY_SECS = 1 days;

    // 全局加密总质押
    euint64 public totalStaked;

    // User staking info
    struct UserInfo {
        euint64 stakedAmount; // Encrypted staked amount
        euint64 rewardDebt; // Encrypted reward debt for reward calculation
        uint256 lastClaimTime; // 上次结算或变更时间（秒）
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

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = cUSDT(_stakingToken);
        rewardToken = CSecretStakeCoin(_rewardToken);

        totalStaked = FHE.asEuint64(0);

        // Initialize error codes
        NO_ERROR = FHE.asEuint64(0);
        INSUFFICIENT_BALANCE = FHE.asEuint64(1);
        INVALID_AMOUNT = FHE.asEuint64(2);
    }

    // 固定利息模型下不再需要按区块刷新池子

    // Stake cUSDT tokens
    function stake(externalEuint64 _encForPlatform, bytes calldata _proofPlatform) external nonReentrant {
        // updatePool();
        console.log("stake 1");
        // Validate and convert external input
        euint64 amount = FHE.fromExternal(_encForPlatform, _proofPlatform);
        console.log("stake 2");
        // Check if amount is valid (> 0)
        // ebool isValidAmount = FHE.gt(amount, 0);
        console.log("stake 3");
        // Get user's current balance
        // euint64 userBalance = stakingToken.confidentialBalanceOf(msg.sender);
        console.log("stake 3.1");
        // FHE.allowTransient(userBalance, address(this));
        console.log("stake 3.2");
        // ebool hasSufficientBalance = FHE.ge(userBalance, amount);
        console.log("stake 4");
        // Combine all conditions
        // ebool canStake = FHE.and(isValidAmount, hasSufficientBalance);
        console.log("stake 5");
        // Set error based on conditions
        // euint64 errorCode = FHE.select(
        //     canStake,
        //     NO_ERROR,
        //     FHE.select(isValidAmount, INSUFFICIENT_BALANCE, INVALID_AMOUNT)
        // );
        // setLastError(errorCode, msg.sender);
        console.log("stake 6");
        // Get user info
        UserInfo storage user = userInfo[msg.sender];
        console.log("stake 7");
        // 固定利息模型：不在 stake 时结算奖励，统一在 claim 中按天结算
        // euint64 pending = FHE.asEuint64(0);

        // 机密转账：对本次金额做瞬时授权，然后从用户转到平台
        FHE.allowTransient(amount, address(stakingToken));
        console.log("stake 7.1");
        stakingToken.confidentialTransferFrom(msg.sender, address(this), amount);
        console.log("stake 8");
        // Update user staked amount
        user.stakedAmount = FHE.add(user.stakedAmount, amount);
        console.log("stake 9");
        // Update total staked
        totalStaked = FHE.add(totalStaked, amount);
        console.log("stake 10");
        // 更新结算时间戳（从本次 stake 开始计时）
        user.rewardDebt = FHE.asEuint64(0);
        user.lastClaimTime = block.timestamp;
        console.log("stake 11");
        // Increment stake count
        userStakeCount[msg.sender]++;
        console.log("stake 12");
        // Grant ACL permissions
        FHE.allowThis(user.stakedAmount);
        FHE.allow(user.stakedAmount, msg.sender);
        FHE.allowThis(user.rewardDebt);
        FHE.allowThis(totalStaked);

        emit Staked(msg.sender, block.number);
    }

    // Withdraw staked tokens
    function withdraw(externalEuint64 _encryptedAmount, bytes calldata _inputProof) external nonReentrant {
        // updatePool();

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

        // 固定利息模型：不在 withdraw 时结算奖励
        euint64 pending = FHE.asEuint64(0);

        // Conditional withdrawal
        euint64 withdrawAmount = FHE.select(canWithdraw, amount, FHE.asEuint64(0));

        // Update user staked amount
        user.stakedAmount = FHE.sub(user.stakedAmount, withdrawAmount);

        // Update total staked
        totalStaked = FHE.sub(totalStaked, withdrawAmount);

        // 更新结算时间戳（从本次 withdraw 后开始重新计时）
        user.rewardDebt = FHE.asEuint64(0);
        user.lastClaimTime = block.timestamp;

        // Transfer staked tokens back to user
        // Authorize this platform (caller in cUSDT) to use the encrypted amount
        FHE.allowThis(withdrawAmount);
        FHE.allow(withdrawAmount, address(stakingToken));
        FHE.allowTransient(withdrawAmount, address(this));
        stakingToken.confidentialTransfer(msg.sender, withdrawAmount);

        // withdraw 不发奖励

        // Grant ACL permissions
        FHE.allowThis(user.stakedAmount);
        FHE.allow(user.stakedAmount, msg.sender);
        FHE.allowThis(user.rewardDebt);
        FHE.allowThis(totalStaked);

        emit Withdrawn(msg.sender, block.number);
    }

    // 开发/本地测试用：明文质押，不转移代币，仅更新加密记账
    function stakePlain(uint64 amount) external nonReentrant {
        // updatePool();

        require(amount > 0, "amount=0");

        UserInfo storage user = userInfo[msg.sender];

        euint64 enc = FHE.asEuint64(amount);
        user.stakedAmount = FHE.add(user.stakedAmount, enc);
        totalStaked = FHE.add(totalStaked, enc);

        user.lastClaimTime = block.timestamp;

        FHE.allowThis(user.stakedAmount);
        FHE.allow(user.stakedAmount, msg.sender);
        FHE.allowThis(totalStaked);

        emit Staked(msg.sender, block.number);
    }

    // Claim pending rewards without withdrawing staked amount
    function claimRewards() external nonReentrant {
        // updatePool();

        UserInfo storage user = userInfo[msg.sender];

        // 计算经过的天数（按自然日，不足一天不计）
        uint256 last = user.lastClaimTime;
        if (last == 0) {
            user.lastClaimTime = block.timestamp;
            emit RewardClaimed(msg.sender, block.number);
            return;
        }
        uint256 elapsed = block.timestamp - last;
        uint64 daysElapsed = uint64(elapsed / DAY_SECS);

        // daysElapsed == 0 时不发放
        if (daysElapsed == 0) {
            emit RewardClaimed(msg.sender, block.number);
            return;
        }

        // stakeUnits = floor(stakedAmount / UNIT)
        euint64 stakeUnits = FHE.div(user.stakedAmount, uint64(UNIT));
        // pending = stakeUnits * daysElapsed * REWARD_PER_UNIT_PER_DAY
        euint64 pending = FHE.mul(stakeUnits, daysElapsed);
        pending = FHE.mul(pending, uint64(REWARD_PER_UNIT_PER_DAY));

        // 通过机密转账发放奖励（平台作为调用者，需要对密文有使用权限）
        FHE.allowThis(pending);
        rewardToken.confidentialTransfer(msg.sender, pending);

        // 更新结算时间到完整天数边界
        user.lastClaimTime = last + uint256(daysElapsed) * DAY_SECS;

        emit RewardClaimed(msg.sender, block.number);
    }

    // View functions
    function getUserStakedAmount(address _user) external view returns (euint64) {
        return userInfo[_user].stakedAmount;
    }

    function getUserRewardDebt(address _user) external view returns (euint64) {
        return userInfo[_user].rewardDebt;
    }

    function getTotalStaked() external view returns (euint64) {
        return totalStaked;
    }

    // 不提供份额累计接口（固定利息模型）

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
    event EmergencyWithdrawCalled(address indexed caller, uint256 blockNumber);

    // Emergency functions (onlyOwner)
    function emergencyWithdraw() external onlyOwner {
        // Emergency withdraw - for simplicity, this function exists but may not
        // be able to transfer encrypted balances without proper FHE access
        // In a real implementation, this would need careful ACL management

        // For now, this function succeeds but may not transfer anything
        // if there are no tokens or if FHE access is not properly set up
        emit EmergencyWithdrawCalled(msg.sender, block.number);
    }

    function updateRewardPerBlock(uint256 /* _newRewardPerBlock */) external onlyOwner {
        // updatePool();
        // Note: In a real implementation, you might want to make REWARD_PER_BLOCK a state variable
        // For now, this is just a placeholder for the interface
    }
}
