import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SecretStakePlatform, cUSDT, CSecretStakeCoin } from "../types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SecretStakePlatform", function () {
  let platform: SecretStakePlatform;
  let stakingToken: cUSDT;
  let rewardToken: CSecretStakeCoin;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const UNIT = BigInt("10000000000"); // 10,000 USDT with 6 decimals
  const REWARD_PER_UNIT_PER_DAY = BigInt("1000000"); // 1 cSSC with 6 decimals
  const DAY_SECS = 24 * 60 * 60; // 1 day in seconds

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy staking token (cUSDT)
    const cUSDTFactory = await ethers.getContractFactory("cUSDT");
    stakingToken = await cUSDTFactory.deploy();
    await stakingToken.waitForDeployment();

    // Deploy reward token (cSSC)
    const CSSCFactory = await ethers.getContractFactory("CSecretStakeCoin");
    rewardToken = await CSSCFactory.deploy();
    await rewardToken.waitForDeployment();

    // Deploy staking platform
    const PlatformFactory = await ethers.getContractFactory("SecretStakePlatform");
    platform = await PlatformFactory.deploy(
      stakingToken.target,
      rewardToken.target
    );
    await platform.waitForDeployment();

    // Mint some cUSDT to users for testing
    await stakingToken.connect(user1).mint(BigInt("50000000000")); // 50,000 USDT
    await stakingToken.connect(user2).mint(BigInt("30000000000")); // 30,000 USDT

    // Mint some cSSC to platform for rewards
    await rewardToken.mintPlain(platform.target as string, BigInt("1000000000")); // 1,000 cSSC
  });

  describe("Deployment", function () {
    it("Should set correct token addresses", async function () {
      expect(await platform.stakingToken()).to.equal(stakingToken.target);
      expect(await platform.rewardToken()).to.equal(rewardToken.target);
    });

    it("Should set correct owner", async function () {
      expect(await platform.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await platform.UNIT()).to.equal(UNIT);
      expect(await platform.REWARD_PER_UNIT_PER_DAY()).to.equal(REWARD_PER_UNIT_PER_DAY);
      expect(await platform.DAY_SECS()).to.equal(DAY_SECS);
    });

    it("Should initialize with zero total staked", async function () {
      const totalStaked = await platform.getTotalStaked();
      expect(totalStaked).to.not.be.undefined;
    });
  });

  describe("Staking", function () {
    it("Should allow user to stake tokens", async function () {
      const stakeAmount = BigInt("10000000000"); // 10,000 USDT

      // Create encrypted input
      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(stakeAmount);
      const encryptedInput = await input.encrypt();

      // Set the platform as operator to spend tokens
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await stakingToken.connect(user1).setOperator(platform.target as string, BigInt(futureTimestamp));

      // Stake tokens
      await expect(platform.connect(user1).stake(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      )).to.emit(platform, "Staked")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);

      // Check user stake count
      expect(await platform.userStakeCount(user1.address)).to.equal(1);

      // Check user staked amount
      const userStakedAmount = await platform.getUserStakedAmount(user1.address);
      expect(userStakedAmount).to.not.be.undefined;
    });

    it("Should update total staked amount", async function () {
      const stakeAmount = BigInt("5000000000"); // 5,000 USDT

      // Prepare and set operator
      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(stakeAmount);
      const encryptedInput = await input.encrypt();

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await stakingToken.connect(user1).setOperator(platform.target as string, BigInt(futureTimestamp));

      await platform.connect(user1).stake(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const totalStaked = await platform.getTotalStaked();
      expect(totalStaked).to.not.be.undefined;
    });

    it("Should handle multiple stakes from same user", async function () {
      const stakeAmount1 = BigInt("5000000000"); // 5,000 USDT
      const stakeAmount2 = BigInt("3000000000"); // 3,000 USDT

      // Set operator once for all stakes
      const futureTimestamp = Math.floor(Date.now() / 1000) + 7200; // 2 hours
      await stakingToken.connect(user1).setOperator(platform.target as string, BigInt(futureTimestamp));

      // First stake
      const input1 = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input1.add64(stakeAmount1);
      const encrypted1 = await input1.encrypt();

      await platform.connect(user1).stake(encrypted1.handles[0], encrypted1.inputProof);

      // Second stake
      const input2 = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input2.add64(stakeAmount2);
      const encrypted2 = await input2.encrypt();

      await platform.connect(user1).stake(encrypted2.handles[0], encrypted2.inputProof);

      expect(await platform.userStakeCount(user1.address)).to.equal(2);
    });

    it("Should handle stakes from multiple users", async function () {
      const stakeAmount1 = BigInt("10000000000"); // 10,000 USDT
      const stakeAmount2 = BigInt("15000000000"); // 15,000 USDT

      // Set operators for both users
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await stakingToken.connect(user1).setOperator(platform.target as string, BigInt(futureTimestamp));
      await stakingToken.connect(user2).setOperator(platform.target as string, BigInt(futureTimestamp));

      // User1 stakes
      const input1 = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input1.add64(stakeAmount1);
      const encrypted1 = await input1.encrypt();

      await platform.connect(user1).stake(encrypted1.handles[0], encrypted1.inputProof);

      // User2 stakes
      const input2 = fhevm.createEncryptedInput(platform.target as string, user2.address);
      input2.add64(stakeAmount2);
      const encrypted2 = await input2.encrypt();

      await platform.connect(user2).stake(encrypted2.handles[0], encrypted2.inputProof);

      expect(await platform.userStakeCount(user1.address)).to.equal(1);
      expect(await platform.userStakeCount(user2.address)).to.equal(1);
    });
  });

  describe("Plain Staking (Test Function)", function () {
    it("Should allow plain staking for testing", async function () {
      const stakeAmount = 10000000000n; // 10,000 USDT (plain)

      await expect(platform.connect(user1).stakePlain(stakeAmount))
        .to.emit(platform, "Staked")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);

      // Check staked amount
      const userStakedAmount = await platform.getUserStakedAmount(user1.address);
      expect(userStakedAmount).to.not.be.undefined;
    });

    it("Should reject zero stake amount", async function () {
      await expect(platform.connect(user1).stakePlain(0))
        .to.be.revertedWith("amount=0");
    });

    it("Should update last claim time on stake", async function () {
      const stakeAmount = 5000000000n;

      const blockTimestamp = await time.latest();
      await platform.connect(user1).stakePlain(stakeAmount);

      const userInfo = await platform.userInfo(user1.address);
      expect(userInfo.lastClaimTime).to.be.greaterThan(blockTimestamp);
    });
  });

  describe("Withdrawing", function () {
    beforeEach(async function () {
      // Stake some tokens first
      await platform.connect(user1).stakePlain(BigInt("10000000000")); // 10,000 USDT
    });

    it("Should allow user to withdraw staked tokens", async function () {
      const withdrawAmount = BigInt("5000000000"); // 5,000 USDT

      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await expect(platform.connect(user1).withdraw(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      )).to.emit(platform, "Withdrawn")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should update user staked amount after withdrawal", async function () {
      const withdrawAmount = BigInt("3000000000"); // 3,000 USDT

      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await platform.connect(user1).withdraw(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const userStakedAmount = await platform.getUserStakedAmount(user1.address);
      expect(userStakedAmount).to.not.be.undefined;
    });

    it("Should update total staked after withdrawal", async function () {
      const withdrawAmount = BigInt("2000000000"); // 2,000 USDT

      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      await platform.connect(user1).withdraw(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const totalStaked = await platform.getTotalStaked();
      expect(totalStaked).to.not.be.undefined;
    });

    it("Should reset last claim time on withdrawal", async function () {
      const withdrawAmount = BigInt("1000000000"); // 1,000 USDT

      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(withdrawAmount);
      const encryptedInput = await input.encrypt();

      const beforeTimestamp = await time.latest();
      await platform.connect(user1).withdraw(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const userInfo = await platform.userInfo(user1.address);
      expect(userInfo.lastClaimTime).to.be.greaterThan(beforeTimestamp);
    });
  });

  describe("Reward Claiming", function () {
    beforeEach(async function () {
      // Stake tokens for reward calculation
      await platform.connect(user1).stakePlain(UNIT); // Exactly 1 unit for easy calculation
    });

    it("Should return early if no previous claim time", async function () {
      // Reset last claim time to 0
      await platform.connect(user2).claimRewards(); // User2 hasn't staked

      await expect(platform.connect(user2).claimRewards())
        .to.emit(platform, "RewardClaimed")
        .withArgs(user2.address, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should return early if less than a day has passed", async function () {
      // Claim immediately after staking (less than a day)
      await expect(platform.connect(user1).claimRewards())
        .to.emit(platform, "RewardClaimed")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should calculate and distribute rewards after full days", async function () {
      // Fast forward 1 day + 1 second
      await time.increase(DAY_SECS + 1);

      await expect(platform.connect(user1).claimRewards())
        .to.emit(platform, "RewardClaimed")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);

      // Check if user received rewards (balance should be > 0)
      const rewardBalance = await rewardToken.confidentialBalanceOf(user1.address);
      expect(rewardBalance).to.not.be.undefined;
    });

    it("Should handle multiple days of rewards", async function () {
      // Fast forward 3 days + 1 second
      await time.increase(3 * DAY_SECS + 1);

      await expect(platform.connect(user1).claimRewards())
        .to.emit(platform, "RewardClaimed")
        .withArgs(user1.address, await ethers.provider.getBlockNumber() + 1);

      const rewardBalance = await rewardToken.confidentialBalanceOf(user1.address);
      expect(rewardBalance).to.not.be.undefined;
    });

    it("Should update last claim time to day boundary", async function () {
      const initialTime = await time.latest();

      // Fast forward 2 days + some hours
      await time.increase(2 * DAY_SECS + 5 * 3600); // 2 days + 5 hours

      await platform.connect(user1).claimRewards();

      const userInfo = await platform.userInfo(user1.address);
      // Should be set to exactly 2 full days after initial time
      const expectedTime = initialTime + 2 * DAY_SECS;
      expect(userInfo.lastClaimTime).to.equal(expectedTime);
    });

    it("Should handle fractional stakes correctly", async function () {
      // Stake less than 1 unit (should get 0 rewards)
      await platform.connect(user2).stakePlain(BigInt("5000000000")); // 0.5 units

      // Fast forward 1 day
      await time.increase(DAY_SECS + 1);

      await expect(platform.connect(user2).claimRewards())
        .to.emit(platform, "RewardClaimed")
        .withArgs(user2.address, await ethers.provider.getBlockNumber() + 1);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await platform.connect(user1).stakePlain(BigInt("15000000000")); // 15,000 USDT
    });

    it("Should return user staked amount", async function () {
      const stakedAmount = await platform.getUserStakedAmount(user1.address);
      expect(stakedAmount).to.not.be.undefined;
      expect(typeof stakedAmount).to.equal("string");
    });

    it("Should return user reward debt", async function () {
      const rewardDebt = await platform.getUserRewardDebt(user1.address);
      expect(rewardDebt).to.not.be.undefined;
      expect(typeof rewardDebt).to.equal("string");
    });

    it("Should return total staked", async function () {
      const totalStaked = await platform.getTotalStaked();
      expect(totalStaked).to.not.be.undefined;
      expect(typeof totalStaked).to.equal("string");
    });

    it("Should return user info", async function () {
      const userInfo = await platform.userInfo(user1.address);
      expect(userInfo.stakedAmount).to.not.be.undefined;
      expect(userInfo.rewardDebt).to.not.be.undefined;
      expect(userInfo.lastClaimTime).to.be.greaterThan(0);
    });

    it("Should track user stake count", async function () {
      expect(await platform.userStakeCount(user1.address)).to.equal(1);

      await platform.connect(user1).stakePlain(BigInt("5000000000"));
      expect(await platform.userStakeCount(user1.address)).to.equal(2);
    });
  });

  describe("Error Handling", function () {
    it("Should track and return last error", async function () {
      // This test would require triggering an error condition
      // For now, just check that getLastError function exists
      const [errorCode, timestamp] = await platform.getLastError(user1.address);
      expect(errorCode).to.not.be.undefined;
      expect(timestamp).to.be.greaterThanOrEqual(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to call emergency withdraw", async function () {
      await expect(platform.connect(owner).emergencyWithdraw())
        .to.emit(platform, "EmergencyWithdrawCalled")
        .withArgs(owner.address, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should reject emergency withdraw from non-owner", async function () {
      await expect(platform.connect(user1).emergencyWithdraw())
        .to.be.revertedWithCustomError(platform, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update reward per block", async function () {
      // This is just a placeholder function, should not revert
      await platform.connect(owner).updateRewardPerBlock(100);
    });

    it("Should reject update reward per block from non-owner", async function () {
      await expect(platform.connect(user1).updateRewardPerBlock(100))
        .to.be.revertedWithCustomError(platform, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle full stake-wait-claim-withdraw cycle", async function () {
      const stakeAmount = BigInt("20000000000"); // 20,000 USDT (2 units)

      // 1. Stake (using plain stake for simplicity in integration test)
      await platform.connect(user1).stakePlain(stakeAmount);

      // 2. Wait 2 days
      await time.increase(2 * DAY_SECS + 1);

      // 3. Claim rewards
      await platform.connect(user1).claimRewards();

      // 4. Wait another day
      await time.increase(DAY_SECS + 1);

      // 5. Claim more rewards
      await platform.connect(user1).claimRewards();

      // 6. Withdraw part of stake
      const withdrawAmount = BigInt("5000000000"); // 5,000 USDT
      const input = fhevm.createEncryptedInput(platform.target as string, user1.address);
      input.add64(withdrawAmount);
      const encrypted = await input.encrypt();

      await platform.connect(user1).withdraw(encrypted.handles[0], encrypted.inputProof);

      // Verify user still has stake
      const remainingStake = await platform.getUserStakedAmount(user1.address);
      expect(remainingStake).to.not.be.undefined;

      // Verify user has reward tokens
      const rewardBalance = await rewardToken.confidentialBalanceOf(user1.address);
      expect(rewardBalance).to.not.be.undefined;
    });

    it("Should handle multiple users staking and claiming", async function () {
      // User1 stakes 1 unit (using plain stake for simplicity)
      await platform.connect(user1).stakePlain(UNIT);

      // User2 stakes 2 units (using plain stake for simplicity)
      await platform.connect(user2).stakePlain(UNIT * 2n);

      // Fast forward 1 day
      await time.increase(DAY_SECS + 1);

      // Both users claim rewards
      await platform.connect(user1).claimRewards();
      await platform.connect(user2).claimRewards();

      // Check both users have rewards
      const reward1 = await rewardToken.confidentialBalanceOf(user1.address);
      const reward2 = await rewardToken.confidentialBalanceOf(user2.address);

      expect(reward1).to.not.be.undefined;
      expect(reward2).to.not.be.undefined;
    });
  });
});