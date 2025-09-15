// Contract addresses configuration
// This file contains all contract addresses used by the frontend
// Update these addresses when deploying to different networks

export const CONTRACT_ADDRESSES = {
  // Main platform contracts
  SECRET_STAKE_PLATFORM: '0xdB03bEdd3ef00Cd5a50Daf4Be90593FE85093e11',
  CUSDT: '0x5a4181ed6afd6E77154AB8B18EB8fF70438456EE',
  CSSC: '0x6F8F8915053378764CeCfE58BBCbAf1EdC626C38',
} as const

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  chainName: 'Sepolia Testnet',
  rpcUrl: 'https://eth-sepolia.public.blastapi.io',
  blockExplorer: {
    name: 'Etherscan',
    url: 'https://sepolia.etherscan.io',
  },
} as const

// Contract deployment information
export const CONTRACT_INFO = {
  SECRET_STAKE_PLATFORM: {
    name: 'Secret Stake Platform',
    description: 'Main staking contract with encrypted rewards',
    deploymentBlock: 0, // Update with actual deployment block
  },
  CUSDT: {
    name: 'Confidential USDT',
    description: 'Encrypted USDT wrapper token',
    deploymentBlock: 0,
  },
  CSSC: {
    name: 'Confidential Secret Stake Coin',
    description: 'Encrypted reward token',
    deploymentBlock: 0,
  },
} as const

// Type definitions for better TypeScript support
export type ContractName = keyof typeof CONTRACT_ADDRESSES
export type ContractAddress = typeof CONTRACT_ADDRESSES[ContractName]

// Helper function to get contract address with type safety
export function getContractAddress(contractName: ContractName): `0x${string}` {
  return CONTRACT_ADDRESSES[contractName] as `0x${string}`
}

// Helper function to get contract info
export function getContractInfo(contractName: ContractName) {
  return CONTRACT_INFO[contractName]
}

// Helper function to get block explorer URL for a contract
export function getContractExplorerUrl(contractName: ContractName): string {
  const address = CONTRACT_ADDRESSES[contractName]
  return `${NETWORK_CONFIG.blockExplorer.url}/address/${address}`
}

// Helper function to get transaction explorer URL
export function getTransactionExplorerUrl(txHash: string): string {
  return `${NETWORK_CONFIG.blockExplorer.url}/tx/${txHash}`
}