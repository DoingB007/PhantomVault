// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice A mock USDT token with faucet functionality for testing
 */
contract MockUSDT is ERC20 {
    // Faucet configuration
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 USDT
    
    // Track claim count for each address (optional tracking)
    mapping(address user => uint256 claimCount) public claimCount;
    
    event FaucetClaim(address indexed user, uint256 amount);
    
    constructor() ERC20("Mock USDT", "USDT") {
        _mint(msg.sender, 1000000 * 10**18); // Initial supply to deployer
    }
    
    /**
     * @notice Claim tokens from faucet
     * @dev Users can claim 1000 USDT anytime, no cooldown
     */
    function claimFaucet() external {
        claimCount[msg.sender]++;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaim(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @notice Get total number of claims by an address
     * @param user The address to check
     * @return Total number of faucet claims
     */
    function getTotalClaims(address user) external view returns (uint256) {
        return claimCount[user];
    }
    
    /**
     * @notice Check if an address can claim from faucet (always true now)
     * @param user The address to check
     * @return Always returns true since there's no cooldown
     */
    function canClaim(address user) external pure returns (bool) {
        return true; // Always can claim since no cooldown
    }
}
