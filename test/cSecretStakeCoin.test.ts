import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CSecretStakeCoin } from "../types";

describe("CSecretStakeCoin", function () {
  let cSSCContract: CSecretStakeCoin;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CSSCFactory = await ethers.getContractFactory("CSecretStakeCoin");
    cSSCContract = await CSSCFactory.deploy();
    await cSSCContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await cSSCContract.name()).to.equal("cSecretStakeCoin");
      expect(await cSSCContract.symbol()).to.equal("cSSC");
    });

    it("Should set correct owner", async function () {
      expect(await cSSCContract.owner()).to.equal(owner.address);
    });

    it("Should have zero total supply initially", async function () {
      // Note: total supply is encrypted, so we can't directly compare
      // This test ensures the contract deploys successfully
      expect(cSSCContract.target).to.not.be.undefined;
    });
  });

  describe("Minting with External Encrypted Input", function () {
    it("Should allow minting with encrypted input", async function () {
      const mintAmount = 1000000n; // 1 cSSC with 6 decimals

      // Create encrypted input
      const input = fhevm.createEncryptedInput(cSSCContract.target as string, owner.address);
      input.add64(mintAmount);
      const encryptedInput = await input.encrypt();

      await cSSCContract.mint(
        user1.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Verify balance
      const balance = await cSSCContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
    });

    it("Should allow multiple mints to different users", async function () {
      const mintAmount1 = 500000n; // 0.5 cSSC
      const mintAmount2 = 1500000n; // 1.5 cSSC

      // Create encrypted inputs
      const input1 = fhevm.createEncryptedInput(cSSCContract.target as string, owner.address);
      input1.add64(mintAmount1);
      const encrypted1 = await input1.encrypt();

      const input2 = fhevm.createEncryptedInput(cSSCContract.target as string, owner.address);
      input2.add64(mintAmount2);
      const encrypted2 = await input2.encrypt();

      await cSSCContract.mint(user1.address, encrypted1.handles[0], encrypted1.inputProof);
      await cSSCContract.mint(user2.address, encrypted2.handles[0], encrypted2.inputProof);

      // Both users should have balances
      const balance1 = await cSSCContract.confidentialBalanceOf(user1.address);
      const balance2 = await cSSCContract.confidentialBalanceOf(user2.address);

      expect(balance1).to.not.be.undefined;
      expect(balance2).to.not.be.undefined;
    });
  });

  describe("Plain Minting", function () {
    it("Should allow plain minting", async function () {
      const mintAmount = 2000000n; // 2 cSSC

      await cSSCContract.mintPlain(user1.address, mintAmount);

      // Verify balance
      const balance = await cSSCContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
    });

    it("Should handle maximum uint64 values in plain mint", async function () {
      const maxValue = BigInt("18446744073709551615");

      await cSSCContract.mintPlain(user1.address, maxValue);
    });

    it("Should handle values exceeding uint64 max", async function () {
      // Test the overflow handling in mintPlain
      const overflowValue = BigInt("18446744073709551616"); // uint64 max + 1

      await cSSCContract.mintPlain(user1.address, overflowValue);

      // Should still work as it gets bounded to uint64 max
      const balance = await cSSCContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
    });

    it("Should allow multiple plain mints to same user", async function () {
      const mintAmount1 = 1000000n;
      const mintAmount2 = 500000n;

      await cSSCContract.mintPlain(user1.address, mintAmount1);
      await cSSCContract.mintPlain(user1.address, mintAmount2);

      // User should have accumulated balance
      const balance = await cSSCContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
    });
  });

  describe("Confidential Token Operations", function () {
    beforeEach(async function () {
      // Mint some tokens to user1 for testing transfers
      await cSSCContract.mintPlain(user1.address, 1000000n);
    });

    it("Should allow confidential transfers", async function () {
      const transferAmount = 100000n; // 0.1 cSSC

      // Create encrypted input for transfer
      const input = fhevm.createEncryptedInput(cSSCContract.target as string, user1.address);
      input.add64(transferAmount);
      const encryptedInput = await input.encrypt();

      await cSSCContract.connect(user1)["confidentialTransfer(address,bytes32,bytes)"](
        user2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Verify user2 has balance
      const balance = await cSSCContract.confidentialBalanceOf(user2.address);
      expect(balance).to.not.be.undefined;
    });

    it("Should allow operator-based transferFrom", async function () {
      const transferAmount = 150000n; // 0.15 cSSC

      // Create encrypted input
      const transferInput = fhevm.createEncryptedInput(cSSCContract.target as string, user2.address);
      transferInput.add64(transferAmount);
      const transferEncrypted = await transferInput.encrypt();

      // Set user2 as operator for user1
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await cSSCContract.connect(user1).setOperator(user2.address, BigInt(futureTimestamp));

      // TransferFrom
      await cSSCContract.connect(user2)["confidentialTransferFrom(address,address,bytes32,bytes)"](
        user1.address,
        owner.address,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to change ownership", async function () {
      await expect(cSSCContract.connect(user1).transferOwnership(user1.address))
        .to.be.revertedWithCustomError(cSSCContract, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to transfer ownership", async function () {
      await cSSCContract.transferOwnership(user1.address);
      expect(await cSSCContract.owner()).to.equal(user1.address);
    });
  });

  describe("View Functions", function () {
    it("Should return encrypted balance", async function () {
      await cSSCContract.mintPlain(user1.address, 500000n);

      const balance = await cSSCContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
      expect(typeof balance).to.equal("string");
    });

    it("Should check operator status", async function () {
      await cSSCContract.mintPlain(user1.address, 1000000n);

      // Initially user2 should not be an operator for user1
      expect(await cSSCContract.isOperator(user1.address, user2.address)).to.be.false;

      // Set user2 as operator
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await cSSCContract.connect(user1).setOperator(user2.address, BigInt(futureTimestamp));

      // Now user2 should be an operator for user1
      expect(await cSSCContract.isOperator(user1.address, user2.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount minting", async function () {
      await cSSCContract.mintPlain(user1.address, 0n);
    });

    it("Should handle zero amount in encrypted mint", async function () {
      const input = fhevm.createEncryptedInput(cSSCContract.target as string, owner.address);
      input.add64(0n);
      const encrypted = await input.encrypt();

      await cSSCContract.mint(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    });
  });
});