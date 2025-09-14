import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockUSDT Faucet", function () {
  let mockUSDT: MockUSDT;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDTFactory.deploy();
    await mockUSDT.waitForDeployment();
  });

  describe("Basic Token Functionality", function () {
    it("Should have correct name and symbol", async function () {
      expect(await mockUSDT.name()).to.equal("Mock USDT");
      expect(await mockUSDT.symbol()).to.equal("USDT");
    });

    it("Should have 18 decimals", async function () {
      expect(await mockUSDT.decimals()).to.equal(18);
    });

    it("Should mint initial supply to deployer", async function () {
      const initialSupply = ethers.parseEther("1000000");
      expect(await mockUSDT.balanceOf(owner.address)).to.equal(initialSupply);
    });
  });

  describe("Faucet Functionality", function () {
    it("Should allow users to claim faucet tokens", async function () {
      const faucetAmount = ethers.parseEther("1000");

      // Check initial balance
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(0);

      // Claim faucet
      await expect(mockUSDT.connect(user1).claimFaucet())
        .to.emit(mockUSDT, "FaucetClaim")
        .withArgs(user1.address, faucetAmount);

      // Check balance after claim
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(faucetAmount);
    });

    it("Should allow multiple claims immediately", async function () {
      const faucetAmount = ethers.parseEther("1000");

      // First claim
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(faucetAmount);

      // Second claim immediately
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(faucetAmount * 2n);

      // Third claim immediately
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(faucetAmount * 3n);
    });

    it("Should track claim count correctly", async function () {
      // Initially should have 0 claims
      expect(await mockUSDT.claimCount(user1.address)).to.equal(0);

      // After first claim
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.claimCount(user1.address)).to.equal(1);

      // After second claim
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.claimCount(user1.address)).to.equal(2);
    });

    it("Should track different users independently", async function () {
      const faucetAmount = ethers.parseEther("1000");

      // User1 claims twice
      await mockUSDT.connect(user1).claimFaucet();
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(faucetAmount * 2n);
      expect(await mockUSDT.claimCount(user1.address)).to.equal(2);

      // User2 claims once
      await mockUSDT.connect(user2).claimFaucet();
      expect(await mockUSDT.balanceOf(user2.address)).to.equal(faucetAmount);
      expect(await mockUSDT.claimCount(user2.address)).to.equal(1);

      // User1's count should remain unchanged
      expect(await mockUSDT.claimCount(user1.address)).to.equal(2);
    });
  });

  describe("View Functions", function () {
    it("Should correctly report canClaim status", async function () {
      // Initially should be able to claim
      expect(await mockUSDT.canClaim(user1.address)).to.be.true;

      // After claiming, should not be able to claim
      await mockUSDT.connect(user1).claimFaucet();
      expect(await mockUSDT.canClaim(user1.address)).to.be.false;

      // After cooldown, should be able to claim again
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await mockUSDT.canClaim(user1.address)).to.be.true;
    });

    it("Should correctly report remaining cooldown time", async function () {
      // Initially should have no cooldown
      expect(await mockUSDT.getRemainingCooldown(user1.address)).to.equal(0);

      // After claiming, should have cooldown
      await mockUSDT.connect(user1).claimFaucet();
      const cooldown = await mockUSDT.getRemainingCooldown(user1.address);
      expect(cooldown).to.be.greaterThan(0);
      expect(cooldown).to.be.lessThanOrEqual(24 * 60 * 60); // Should be <= 24 hours

      // After cooldown period, should be 0 again
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await mockUSDT.getRemainingCooldown(user1.address)).to.equal(0);
    });

    it("Should track lastClaimTime correctly", async function () {
      // Initially should be 0
      expect(await mockUSDT.lastClaimTime(user1.address)).to.equal(0);

      // After claiming, should be set to current timestamp
      const tx = await mockUSDT.connect(user1).claimFaucet();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(await mockUSDT.lastClaimTime(user1.address)).to.equal(block!.timestamp);
    });
  });

  describe("Constants", function () {
    it("Should have correct faucet amount", async function () {
      const expectedAmount = ethers.parseEther("1000");
      expect(await mockUSDT.FAUCET_AMOUNT()).to.equal(expectedAmount);
    });

    it("Should have correct cooldown time", async function () {
      const expectedCooldown = 24 * 60 * 60; // 24 hours in seconds
      expect(await mockUSDT.COOLDOWN_TIME()).to.equal(expectedCooldown);
    });
  });
});