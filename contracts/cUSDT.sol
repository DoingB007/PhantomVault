// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {
    ConfidentialFungibleTokenERC20Wrapper
} from "@openzeppelin/confidential-contracts/token/extensions/ConfidentialFungibleTokenERC20Wrapper.sol";
import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract cUSDT is ConfidentialFungibleTokenERC20Wrapper, SepoliaConfig {
    constructor(
        IERC20 underlyingToken
    ) ConfidentialFungibleToken("cUSDT", "cUSDT", "") ConfidentialFungibleTokenERC20Wrapper(underlyingToken) {}
}
