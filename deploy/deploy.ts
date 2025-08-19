import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Secret Stake Platform contracts...");
  console.log("Deployer address:", deployer);

  // 1. Deploy Mock USDT (for testing)
  const mockUSDT = await deploy("MockUSDT", {
    from: deployer,
    log: true,
  });
  console.log(`MockUSDT deployed at: ${mockUSDT.address}`);

  // 2. Deploy cUSDT (confidential USDT wrapper)
  const cUSDT = await deploy("cUSDT", {
    from: deployer,
    args: [mockUSDT.address], // underlying token address
    log: true,
  });
  console.log(`cUSDT deployed at: ${cUSDT.address}`);

  // 3. Deploy CSecretStakeCoin (reward token)
  const cSecretStakeCoin = await deploy("CSecretStakeCoin", {
    from: deployer,
    log: true,
  });
  console.log(`CSecretStakeCoin deployed at: ${cSecretStakeCoin.address}`);

  // 4. Deploy SecretStakePlatform
  const secretStakePlatform = await deploy("SecretStakePlatform", {
    from: deployer,
    args: [
      mockUSDT.address,        // underlying USDT
      cUSDT.address,           // confidential USDT
      cSecretStakeCoin.address // reward token
    ],
    log: true,
  });
  console.log(`SecretStakePlatform deployed at: ${secretStakePlatform.address}`);

  // Post-deployment setup
  console.log("\nPost-deployment setup:");

  // Get contract instances
  const mockUSDTContract = await hre.ethers.getContractAt("MockUSDT", mockUSDT.address);
  const cSecretStakeCoinContract = await hre.ethers.getContractAt("CSecretStakeCoin", cSecretStakeCoin.address);
  const stakeContract = await hre.ethers.getContractAt("SecretStakePlatform", secretStakePlatform.address);

  // Transfer ownership of reward token to staking platform
  console.log("Transferring CSecretStakeCoin ownership to staking platform...:",secretStakePlatform.address);
  const owner = await cSecretStakeCoinContract.owner()
  console.log("owner:",owner);
  
  const transferOwnershipTx = await cSecretStakeCoinContract.transferOwnership(secretStakePlatform.address);
  await transferOwnershipTx.wait();
  console.log("✅ Ownership transferred");

  // Give some USDT to deployer for testing (already done in constructor, but let's verify)
  const deployerBalance = await mockUSDTContract.balanceOf(deployer);
  console.log(`Deployer USDT balance: ${hre.ethers.formatEther(deployerBalance)} USDT`);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log(`- MockUSDT:                ${mockUSDT.address}`);
  console.log(`- cUSDT:                   ${cUSDT.address}`);
  console.log(`- CSecretStakeCoin:        ${cSecretStakeCoin.address}`);
  console.log(`- SecretStakePlatform: ${secretStakePlatform.address}`);
  
  console.log("\nNext Steps:");
  console.log("1. Approve cUSDT contract to spend your USDT tokens");
  console.log("2. Wrap USDT to cUSDT using the wrapper functions");
  console.log("3. Stake cUSDT in the SecretStakePlatform to earn cSSC rewards");
};
export default func;
func.id = "deploy_fheCounter"; // id required to prevent reexecution
func.tags = ["FHECounter"];
