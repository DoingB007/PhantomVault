// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

contract CSecretStakeCoin is ConfidentialFungibleToken, Ownable, SepoliaConfig {
    constructor() ConfidentialFungibleToken("cSecretStakeCoin", "cSSC", "") Ownable(msg.sender) {}

    function mint(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _mint(to, amount);
    }

    // Overload for internal use with plain amounts (6 decimals base units)
    function mintPlain(address to, uint256 amount) external {
        uint64 bounded = amount > type(uint64).max ? type(uint64).max : uint64(amount);
        euint64 encryptedAmount = FHE.asEuint64(bounded);
        _mint(to, encryptedAmount);
    }
}
