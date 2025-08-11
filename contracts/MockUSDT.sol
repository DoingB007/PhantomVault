// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ConfidentialToken
 * @notice A concrete implementation of ConfidentialERC20 that can be deployed with custom name and symbol
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("USDT", "USDT") {
        _mint(msg.sender, 1000000 * 10e18);
    }
}
