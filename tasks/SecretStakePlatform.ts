import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * SecretStakePlatform Tasks
 * =========================
 * 
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *   npx hardhat node
 *
 * 2. Deploy the SecretStakePlatform contract
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the SecretStakePlatform contract
 *   npx hardhat --network localhost task:stake --amount 1000000000000000000
 *   npx hardhat --network localhost task:get-staked-amount
 *   npx hardhat --network localhost task:claim-rewards
 *   npx hardhat --network localhost task:withdraw --amount 500000000000000000
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the SecretStakePlatform contract
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the SecretStakePlatform contract
 *   npx hardhat --network sepolia task:stake --amount 1000000000000000000
 *   npx hardhat --network sepolia task:get-staked-amount
 *   npx hardhat --network sepolia task:claim-rewards
 *   npx hardhat --network sepolia task:withdraw --amount 500000000000000000
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:platform-address
 *   - npx hardhat --network sepolia task:platform-address
 */
task("task:platform-address", "Prints the SecretStakePlatform address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const secretStakePlatform = await deployments.get("SecretStakePlatform");

  console.log("SecretStakePlatform address is " + secretStakePlatform.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:get-staked-amount
 *   - npx hardhat --network sepolia task:get-staked-amount
 */
task("task:get-staked-amount", "Gets the user's staked amount")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const encryptedStakedAmount = await platformContract.getUserStakedAmount(userAddress);
    if (encryptedStakedAmount === ethers.ZeroHash) {
      console.log(`Encrypted staked amount: ${encryptedStakedAmount}`);
      console.log("Clear staked amount    : 0");
      return;
    }

    const clearStakedAmount = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedStakedAmount,
      SecretStakePlatformDeployment.address,
      signers[0],
    );
    console.log(`Encrypted staked amount: ${encryptedStakedAmount}`);
    console.log(`Clear staked amount    : ${clearStakedAmount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-pending-rewards
 *   - npx hardhat --network sepolia task:get-pending-rewards
 */
task("task:get-pending-rewards", "Gets the user's pending rewards")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const encryptedPendingRewards = await platformContract.pendingRewards(userAddress);
    if (encryptedPendingRewards === ethers.ZeroHash) {
      console.log(`Encrypted pending rewards: ${encryptedPendingRewards}`);
      console.log("Clear pending rewards    : 0");
      return;
    }

    const clearPendingRewards = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPendingRewards,
      SecretStakePlatformDeployment.address,
      signers[0],
    );
    console.log(`Encrypted pending rewards: ${encryptedPendingRewards}`);
    console.log(`Clear pending rewards    : ${clearPendingRewards}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-total-staked
 *   - npx hardhat --network sepolia task:get-total-staked
 */
task("task:get-total-staked", "Gets the total staked amount")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const encryptedTotalStaked = await platformContract.getTotalStaked();
    if (encryptedTotalStaked === ethers.ZeroHash) {
      console.log(`Encrypted total staked: ${encryptedTotalStaked}`);
      console.log("Clear total staked    : 0");
      return;
    }

    const clearTotalStaked = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedTotalStaked,
      SecretStakePlatformDeployment.address,
      signers[0],
    );
    console.log(`Encrypted total staked: ${encryptedTotalStaked}`);
    console.log(`Clear total staked    : ${clearTotalStaked}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:stake --amount 1000000000000000000
 *   - npx hardhat --network sepolia task:stake --amount 1000000000000000000
 */
task("task:stake", "Stakes cUSDT tokens to the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addParam("amount", "The amount to stake (in wei)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const amount = BigInt(taskArguments.amount);
    if (amount <= 0n) {
      throw new Error(`Amount must be greater than 0`);
    }

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    // Encrypt the amount
    const encryptedAmount = await fhevm
      .createEncryptedInput(SecretStakePlatformDeployment.address, signers[0].address)
      .add64(amount)
      .encrypt();

    const tx = await platformContract
      .connect(signers[0])
      .stake(encryptedAmount.handles[0], encryptedAmount.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Stake of ${amount.toString()} succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:withdraw --amount 500000000000000000
 *   - npx hardhat --network sepolia task:withdraw --amount 500000000000000000
 */
task("task:withdraw", "Withdraws staked tokens from the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addParam("amount", "The amount to withdraw (in wei)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const amount = BigInt(taskArguments.amount);
    if (amount <= 0n) {
      throw new Error(`Amount must be greater than 0`);
    }

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    // Encrypt the amount
    const encryptedAmount = await fhevm
      .createEncryptedInput(SecretStakePlatformDeployment.address, signers[0].address)
      .add64(amount)
      .encrypt();

    const tx = await platformContract
      .connect(signers[0])
      .withdraw(encryptedAmount.handles[0], encryptedAmount.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Withdraw of ${amount.toString()} succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:claim-rewards
 *   - npx hardhat --network sepolia task:claim-rewards
 */
task("task:claim-rewards", "Claims pending rewards from the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const tx = await platformContract.connect(signers[0]).claimRewards();
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Claim rewards succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:update-pool
 *   - npx hardhat --network sepolia task:update-pool
 */
task("task:update-pool", "Updates the reward pool")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const tx = await platformContract.connect(signers[0]).updatePool();
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Update pool succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-last-error
 *   - npx hardhat --network sepolia task:get-last-error
 */
task("task:get-last-error", "Gets the last error for a user")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const [encryptedError, timestamp] = await platformContract.getLastError(userAddress);
    
    if (encryptedError === ethers.ZeroHash) {
      console.log(`Encrypted error: ${encryptedError}`);
      console.log("Clear error code: 0");
      console.log(`Timestamp: ${timestamp}`);
      return;
    }

    const clearError = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedError,
      SecretStakePlatformDeployment.address,
      signers[0],
    );
    
    console.log(`Encrypted error: ${encryptedError}`);
    console.log(`Clear error code: ${clearError}`);
    console.log(`Timestamp: ${timestamp}`);
    
    // Decode error meaning
    const errorMeaning = clearError === 0n ? "NO_ERROR" : 
                        clearError === 1n ? "INSUFFICIENT_BALANCE" :
                        clearError === 2n ? "INVALID_AMOUNT" : "UNKNOWN_ERROR";
    console.log(`Error meaning: ${errorMeaning}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-user-info
 *   - npx hardhat --network sepolia task:get-user-info
 */
task("task:get-user-info", "Gets comprehensive user information")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    console.log(`\n=== User Information for ${userAddress} ===`);

    // Get staked amount
    const encryptedStakedAmount = await platformContract.getUserStakedAmount(userAddress);
    const clearStakedAmount = encryptedStakedAmount === ethers.ZeroHash ? 0n : 
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedStakedAmount, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Staked Amount: ${clearStakedAmount.toString()}`);

    // Get reward debt
    const encryptedRewardDebt = await platformContract.getUserRewardDebt(userAddress);
    const clearRewardDebt = encryptedRewardDebt === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedRewardDebt, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Reward Debt: ${clearRewardDebt.toString()}`);

    // Get pending rewards
    const encryptedPendingRewards = await platformContract.pendingRewards(userAddress);
    const clearPendingRewards = encryptedPendingRewards === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedPendingRewards, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Pending Rewards: ${clearPendingRewards.toString()}`);

    // Get user info struct
    const userInfo = await platformContract.userInfo(userAddress);
    console.log(`Last Stake Block: ${userInfo.lastStakeBlock}`);

    // Get stake count
    const stakeCount = await platformContract.userStakeCount(userAddress);
    console.log(`Stake Count: ${stakeCount}`);

    // Get last error
    const [encryptedError, timestamp] = await platformContract.getLastError(userAddress);
    const clearError = encryptedError === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedError, SecretStakePlatformDeployment.address, signers[0]);
    const errorMeaning = clearError === 0n ? "NO_ERROR" : 
                        clearError === 1n ? "INSUFFICIENT_BALANCE" :
                        clearError === 2n ? "INVALID_AMOUNT" : "UNKNOWN_ERROR";
    console.log(`Last Error: ${errorMeaning} (${clearError}) at ${timestamp}`);

    console.log(`================================\n`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:platform-info
 *   - npx hardhat --network sepolia task:platform-info
 */
task("task:platform-info", "Gets comprehensive platform information")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    console.log(`\n=== Platform Information ===`);

    // Get total staked
    const encryptedTotalStaked = await platformContract.getTotalStaked();
    const clearTotalStaked = encryptedTotalStaked === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedTotalStaked, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Total Staked: ${clearTotalStaked.toString()}`);

    // Get accumulated reward per share
    const encryptedAccRewardPerShare = await platformContract.getAccRewardPerShare();
    const clearAccRewardPerShare = encryptedAccRewardPerShare === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedAccRewardPerShare, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Accumulated Reward Per Share: ${clearAccRewardPerShare.toString()}`);

    // Get reward per block
    const rewardPerBlock = await platformContract.REWARD_PER_BLOCK();
    console.log(`Reward Per Block: ${rewardPerBlock.toString()}`);

    // Get last reward block
    const lastRewardBlock = await platformContract.lastRewardBlock();
    console.log(`Last Reward Block: ${lastRewardBlock}`);

    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    // Calculate blocks since last reward
    const blocksSinceLastReward = currentBlock - Number(lastRewardBlock);
    console.log(`Blocks Since Last Reward: ${blocksSinceLastReward}`);

    // Get token addresses
    const stakingTokenAddress = await platformContract.stakingToken();
    const rewardTokenAddress = await platformContract.rewardToken();
    const underlyingUSDTAddress = await platformContract.underlyingUSDT();
    console.log(`Staking Token (cUSDT): ${stakingTokenAddress}`);
    console.log(`Reward Token (cSSC): ${rewardTokenAddress}`);
    console.log(`Underlying USDT: ${underlyingUSDTAddress}`);

    console.log(`==========================\n`);
  });