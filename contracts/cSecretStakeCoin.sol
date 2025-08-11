// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

contract CSecretStakeCoin is ConfidentialFungibleToken, Ownable, SepoliaConfig {
    constructor() ConfidentialFungibleToken("cSecretStakeCoin", "cSSC", "") Ownable(msg.sender) {}
    
    function mint(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyOwner {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _mint(to, amount);
    }
    
    // Overload for internal use with plain amounts
    function mintPlain(address to, uint256 amount) external onlyOwner {
        euint64 encryptedAmount = euint64.wrap(bytes32(amount));
        _mint(to, encryptedAmount);
    }
}
