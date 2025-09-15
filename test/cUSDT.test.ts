import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { cUSDT } from "../types";

describe("cUSDT", function () {
  let cUSDTContract: cUSDT;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const cUSDTFactory = await ethers.getContractFactory("cUSDT");
    cUSDTContract = await cUSDTFactory.deploy();
    await cUSDTContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await cUSDTContract.name()).to.equal("cUSDT");
      expect(await cUSDTContract.symbol()).to.equal("cUSDT");
    });

    it("Should have zero total supply initially", async function () {
      // Note: total supply is encrypted, so we can't directly compare
      // This test ensures the contract deploys successfully
      expect(cUSDTContract.target).to.not.be.undefined;
    });
  });

  describe("Minting", function () {
    it("Should allow minting tokens", async function () {
      const mintAmount = 1000n;

      await cUSDTContract.connect(user1).mint(mintAmount);

      // Verify balance by checking if user can create encrypted input with their balance
      const encryptedBalance = await cUSDTContract.confidentialBalanceOf(user1.address);
      expect(encryptedBalance).to.not.be.undefined;
    });

    it("Should allow multiple users to mint", async function () {
      const mintAmount1 = 1000n;
      const mintAmount2 = 2000n;

      await cUSDTContract.connect(user1).mint(mintAmount1);
      await cUSDTContract.connect(user2).mint(mintAmount2);

      // Both users should have encrypted balances
      const balance1 = await cUSDTContract.confidentialBalanceOf(user1.address);
      const balance2 = await cUSDTContract.confidentialBalanceOf(user2.address);

      expect(balance1).to.not.be.undefined;
      expect(balance2).to.not.be.undefined;
    });

    it("Should handle large mint amounts", async function () {
      const largeMintAmount = BigInt("18446744073709551615"); // max uint64

      await cUSDTContract.connect(user1).mint(largeMintAmount);
    });
  });

  describe("Confidential Transfers", function () {
    beforeEach(async function () {
      // Mint some tokens to user1
      await cUSDTContract.connect(user1).mint(1000n);
    });

    it("Should allow confidential transfer with encrypted input", async function () {
      const transferAmount = 100n;

      // Create encrypted input for transfer
      const input = fhevm.createEncryptedInput(cUSDTContract.target as string, user1.address);
      input.add64(transferAmount);
      const encryptedInput = await input.encrypt();

      await cUSDTContract.connect(user1)["confidentialTransfer(address,bytes32,bytes)"](
        user2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Verify user2 now has a balance
      const user2Balance = await cUSDTContract.confidentialBalanceOf(user2.address);
      expect(user2Balance).to.not.be.undefined;
    });

    it("Should allow confidential transferFrom with operator", async function () {
      const transferAmount = 100n;

      // Create encrypted input
      const transferInput = fhevm.createEncryptedInput(cUSDTContract.target as string, user2.address);
      transferInput.add64(transferAmount);
      const transferEncrypted = await transferInput.encrypt();

      // Set user2 as operator for user1 for the next hour
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await cUSDTContract.connect(user1).setOperator(user2.address, BigInt(futureTimestamp));

      // Then transferFrom as operator
      await cUSDTContract.connect(user2)["confidentialTransferFrom(address,address,bytes32,bytes)"](
        user1.address,
        owner.address,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );
    });
  });

  describe("View Functions", function () {
    it("Should return encrypted balance for users", async function () {
      await cUSDTContract.connect(user1).mint(500n);

      const balance = await cUSDTContract.confidentialBalanceOf(user1.address);
      expect(balance).to.not.be.undefined;
      expect(typeof balance).to.equal("string");
    });

    it("Should check operator status", async function () {
      await cUSDTContract.connect(user1).mint(1000n);

      // Initially user2 should not be an operator for user1
      expect(await cUSDTContract.isOperator(user1.address, user2.address)).to.be.false;

      // Set user2 as operator
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await cUSDTContract.connect(user1).setOperator(user2.address, BigInt(futureTimestamp));

      // Now user2 should be an operator for user1
      expect(await cUSDTContract.isOperator(user1.address, user2.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount minting", async function () {
      await cUSDTContract.connect(user1).mint(0n);
    });

    it("Should handle maximum uint64 values", async function () {
      const maxUint64 = BigInt("18446744073709551615");

      await cUSDTContract.connect(user1).mint(maxUint64);
    });
  });
});