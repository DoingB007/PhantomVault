// Main config exports
// This file serves as the main entry point for all configuration

// Contract addresses and network config
export {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  CONTRACT_INFO,
  getContractAddress,
  getContractInfo,
  getContractExplorerUrl,
  getTransactionExplorerUrl,
  type ContractName,
  type ContractAddress,
} from './contracts'

// Contract ABIs
export {
  COMMON_ABIS,
  getABI,
  type ABIName,
  type ABI,
} from './abis'

// FHEVM configuration
export { initFhevm } from './fhevm'