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
 *   npx hardhat --network localhost task:wrap-usdt --amount 2000
 *   npx hardhat --network localhost task:stake --amount 1000
 *   npx hardhat --network localhost task:get-staked-amount
 *   npx hardhat --network localhost task:claim-rewards
 *   npx hardhat --network localhost task:withdraw --amount 500
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the SecretStakePlatform contract
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the SecretStakePlatform contract
 *   npx hardhat --network sepolia task:wrap-usdt --amount 2000
 *   npx hardhat --network sepolia task:stake --amount 1000
 *   npx hardhat --network sepolia task:get-staked-amount
 *   npx hardhat --network sepolia task:claim-rewards
 *   npx hardhat --network sepolia task:withdraw --amount 500
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
 *   - npx hardhat --network localhost task:get-cusdt-balance
 *   - npx hardhat --network sepolia task:get-cusdt-balance --user 0x...
 */
task("task:get-cusdt-balance", "Decrypt and show user's cUSDT balance")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .addOptionalParam("token", "Optionally specify the cUSDT contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const cUSDTDeployment = taskArguments.token
      ? { address: taskArguments.token }
      : await deployments.get("cUSDT");
    const cusdt = await ethers.getContractAt("cUSDT", cUSDTDeployment.address);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    console.log(`cUSDT: ${cUSDTDeployment.address}`);
    console.log(`User : ${userAddress}`);

    const encryptedBalance = await cusdt.confidentialBalanceOf(userAddress);
    if (encryptedBalance === ethers.ZeroHash) {
      console.log(`Encrypted balance: ${encryptedBalance}`);
      console.log("Clear balance    : 0");
      return;
    }

    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      cUSDTDeployment.address,
      signers[0],
    );

    console.log(`Encrypted balance: ${encryptedBalance}`);
    console.log(`Clear balance    : ${clearBalance}`);
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
// Task: Set operator for ctoken transfers
task("task:approve", "Approve contract as operator")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    const SecretStakePlatformDeployment = await deployments.get("SecretStakePlatform");
    const cUSDTDepolyment = await deployments.get("cUSDT");

    const cusdt = await ethers.getContractAt("cUSDT", cUSDTDepolyment.address);
    const until = Math.floor(Date.now() / 1000) + 1000000
    console.log("Approving operator...");
    const approveTx = await cusdt.setOperator(SecretStakePlatformDeployment.address, until);
    await approveTx.wait();
    console.log("Transaction:", approveTx.hash);
  });

// Debug: check operator status
task("task:check-operator", "Check if platform is operator for signer on cUSDT")
  .setAction(async function (_args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretStakePlatformDeployment = await deployments.get("SecretStakePlatform");
    const cUSDTDepolyment = await deployments.get("cUSDT");
    const cusdt = await ethers.getContractAt("cUSDT", cUSDTDepolyment.address);
    const [signer] = await ethers.getSigners();
    const isOp = await cusdt.isOperator(signer.address, SecretStakePlatformDeployment.address);
    console.log(`Holder ${signer.address} -> platform ${SecretStakePlatformDeployment.address} operator? ${isOp}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:stake --amount 1000
 *   - npx hardhat --network sepolia task:stake --amount 1000
 */
task("task:stake", "Stakes cUSDT tokens to the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addParam("amount", "Amount to stake (standard units; 6 decimals internally)")
  .addOptionalParam("gas", "Custom gas limit (default: 12000000)", "12000000")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    // const inputAmount = BigInt(taskArguments.amount);
    // if (inputAmount <= 0n) {
    //   throw new Error(`Amount must be greater than 0`);
    // }

    const amount = parseInt(taskArguments.amount) * 10 ** 6; // Convert to smallest unit (6 decimals)

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address}`);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    // 仅为平台合约加密一次（平台 fromExternal 后用 allowTransient 调用 cUSDT）
    const encForPlatform = await fhevm
      .createEncryptedInput(SecretStakePlatformDeployment.address, signers[0].address)
      .add64(amount)
      .encrypt();

    const gasLimit = BigInt("30000000");
    const tx = await platformContract
      .connect(signers[0])
      .stake(encForPlatform.handles[0], encForPlatform.inputProof, { gasLimit });
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Stake of ${amount / 10 ** 6} tokens(${amount.toString()} base units) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:withdraw --amount 500
 *   - npx hardhat --network sepolia task:withdraw --amount 500
 */
task("task:withdraw", "Withdraws staked tokens from the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addParam("amount", "Amount to withdraw (standard units; 6 decimals internally)")
  .addOptionalParam("gas", "Custom gas limit (default: 12000000)", "12000000")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const inputAmount = BigInt(taskArguments.amount);
    if (inputAmount <= 0n) {
      throw new Error(`Amount must be greater than 0`);
    }

    const amount = inputAmount * BigInt(10 ** 6); // Convert to smallest unit (6 decimals)

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

    const gasLimit = BigInt(taskArguments.gas || "12000000");
    const tx = await platformContract
      .connect(signers[0])
      .withdraw(encryptedAmount.handles[0], encryptedAmount.inputProof, { gasLimit });
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status = ${receipt?.status} `);

    console.log(`Withdraw of ${inputAmount.toString()} tokens(${amount.toString()} base units) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:claim-rewards
 *   - npx hardhat --network sepolia task:claim-rewards
 */
task("task:claim-rewards", "Claims pending rewards from the platform")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const tx = await platformContract.connect(signers[0]).claimRewards();
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status = ${receipt?.status} `);

    console.log(`Claim rewards succeeded!`);
  });

// 本地调试：明文质押（不转移代币）
task("task:stake-plain", "Stake by plaintext amount (testing only)")
  .addOptionalParam("address", "Optionally specify the SecretStakePlatform contract address")
  .addParam("amount", "Amount to stake (standard units; 6 decimals internally)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const inputAmount = BigInt(taskArguments.amount);
    if (inputAmount <= 0n) {
      throw new Error(`Amount must be greater than 0`);
    }

    const amount = inputAmount * BigInt(10 ** 6); // 6 decimals

    const SecretStakePlatformDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretStakePlatform");
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const [signer] = await ethers.getSigners();
    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const tx = await platformContract.connect(signer).stakePlain(amount);
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status = ${receipt?.status} `);
    console.log(`StakePlain of ${inputAmount.toString()} tokens(${amount.toString()} base units) succeeded!`);
  });

// 本地调试：快进 N 天
task("task:fast-forward-days", "Increase evm time for localhost")
  .addParam("days", "Days to fast forward", "1")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const days = parseInt(taskArguments.days);
    if (!Number.isInteger(days) || days <= 0) throw new Error("days must be positive integer");
    const seconds = days * 24 * 60 * 60;
    await hre.ethers.provider.send("evm_increaseTime", [seconds]);
    await hre.ethers.provider.send("evm_mine", []);
    console.log(`Time advanced by ${days} day(s).`);
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
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const tx = await platformContract.connect(signers[0]).updatePool();
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status = ${receipt?.status} `);

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
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    const [encryptedError, timestamp] = await platformContract.getLastError(userAddress);

    if (encryptedError === ethers.ZeroHash) {
      console.log(`Encrypted error: ${encryptedError} `);
      console.log("Clear error code: 0");
      console.log(`Timestamp: ${timestamp} `);
      return;
    }

    const clearError = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedError,
      SecretStakePlatformDeployment.address,
      signers[0],
    );

    console.log(`Encrypted error: ${encryptedError} `);
    console.log(`Clear error code: ${clearError} `);
    console.log(`Timestamp: ${timestamp} `);

    // Decode error meaning
    const errorMeaning = clearError === 0n ? "NO_ERROR" :
      clearError === 1n ? "INSUFFICIENT_BALANCE" :
        clearError === 2n ? "INVALID_AMOUNT" : "UNKNOWN_ERROR";
    console.log(`Error meaning: ${errorMeaning} `);
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
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    console.log(`\n === User Information for ${userAddress} === `);

    // Get staked amount
    const encryptedStakedAmount = await platformContract.getUserStakedAmount(userAddress);
    const clearStakedAmount = encryptedStakedAmount === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedStakedAmount, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Staked Amount: ${clearStakedAmount.toString()} `);

    // Get reward debt
    const encryptedRewardDebt = await platformContract.getUserRewardDebt(userAddress);
    const clearRewardDebt = encryptedRewardDebt === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedRewardDebt, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Reward Debt: ${clearRewardDebt.toString()} `);

    // Get pending rewards
    const encryptedPendingRewards = await platformContract.pendingRewards(userAddress);
    const clearPendingRewards = encryptedPendingRewards === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedPendingRewards, SecretStakePlatformDeployment.address, signers[0]);
    console.log(`Pending Rewards: ${clearPendingRewards.toString()} `);

    // Get user info struct
    const userInfo = await platformContract.userInfo(userAddress);
    console.log(`Last Stake Block: ${userInfo.lastStakeBlock} `);

    // Get stake count
    const stakeCount = await platformContract.userStakeCount(userAddress);
    console.log(`Stake Count: ${stakeCount} `);

    // Get last error
    const [encryptedError, timestamp] = await platformContract.getLastError(userAddress);
    const clearError = encryptedError === ethers.ZeroHash ? 0n :
      await fhevm.userDecryptEuint(FhevmType.euint64, encryptedError, SecretStakePlatformDeployment.address, signers[0]);
    const errorMeaning = clearError === 0n ? "NO_ERROR" :
      clearError === 1n ? "INSUFFICIENT_BALANCE" :
        clearError === 2n ? "INVALID_AMOUNT" : "UNKNOWN_ERROR";
    console.log(`Last Error: ${errorMeaning} (${clearError}) at ${timestamp} `);

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
    console.log(`SecretStakePlatform: ${SecretStakePlatformDeployment.address} `);

    const signers = await ethers.getSigners();

    const platformContract = await ethers.getContractAt("SecretStakePlatform", SecretStakePlatformDeployment.address);

    console.log(`\n === Platform Information === `);

    // 平台级字段为机密数据：仅打印密文句柄，不尝试解密
    const encryptedTotalStaked = await platformContract.getTotalStaked();
    console.log(`Encrypted Total Staked: ${encryptedTotalStaked} `);

    // 累计奖励指标接口已移除（固定利息模型），不再输出

    // Fixed daily reward model
    const UNIT = await platformContract.UNIT();
    const REWARD_PER_UNIT_PER_DAY = await platformContract.REWARD_PER_UNIT_PER_DAY();
    console.log(`Unit(10k USDT in base units): ${UNIT.toString()} `);
    console.log(`Reward Per Unit Per Day: ${REWARD_PER_UNIT_PER_DAY.toString()} `);

    // Get last reward block
    const lastRewardBlock = await platformContract.lastRewardBlock();
    console.log(`Last Reward Block: ${lastRewardBlock} `);

    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock} `);

    // Last reward block retained for compatibility only

    // Get token addresses
    const stakingTokenAddress = await platformContract.stakingToken();
    const rewardTokenAddress = await platformContract.rewardToken();

    console.log(`Staking Token(cUSDT): ${stakingTokenAddress} `);
    console.log(`Reward Token(cSSC): ${rewardTokenAddress} `);

    console.log(`==========================\n`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:mint-cusdt --amount 10000
 *   - npx hardhat --network sepolia task:mint-cusdt --amount 10000
 */
task("task:mint-cusdt", "Mint cUSDT tokens for testing")
  .addParam("amount", "Amount to mint", "10000")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const cUSDTDeployment = await deployments.get("cUSDT");
    const cUSDT = await ethers.getContractAt("cUSDT", cUSDTDeployment.address);

    // ConfidentialToken uses 6 decimals, not 18
    const amount = parseInt(taskArguments.amount) * 10 ** 6;
    const tx = await cUSDT.mint(amount);
    await tx.wait();

    console.log(`Successfully minted ${taskArguments.amount} cUSDT tokens`);
    console.log(`Transaction: ${tx.hash} `);
  });
