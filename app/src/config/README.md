# Config Directory

This directory contains all configuration files for the frontend application.

## Files

### `contracts.ts`
Contains all contract addresses, network configuration, and utility functions:
- `CONTRACT_ADDRESSES`: All deployed contract addresses
- `NETWORK_CONFIG`: Network settings (chainId, RPC URL, etc.)
- `CONTRACT_INFO`: Metadata about each contract
- Helper functions for type-safe address access and block explorer URLs

### `abis.ts`
Contains commonly used contract ABIs:
- `COMMON_ABIS.ERC20`: Standard ERC20 token functions
- `COMMON_ABIS.WRAPPER`: Wrapper contract functions (wrap/unwrap)
- `COMMON_ABIS.FHE_COMMON`: Common FHE functions

### `fhevm.ts`
Contains FHEVM initialization logic for the Sepolia testnet.

### `index.ts`
Main entry point that exports all configuration. Import from here in components:

```typescript
import { CONTRACT_ADDRESSES, COMMON_ABIS } from '../config'
```

## Usage

### Getting Contract Addresses
```typescript
import { CONTRACT_ADDRESSES, getContractAddress } from '../config'

// Direct access
const platformAddress = CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM

// Type-safe access
const cusdtAddress = getContractAddress('CUSDT')
```

### Using ABIs
```typescript
import { COMMON_ABIS, getABI } from '../config'

// Direct access
const erc20Abi = COMMON_ABIS.ERC20

// Type-safe access
const wrapperAbi = getABI('WRAPPER')
```

### Block Explorer Links
```typescript
import { getContractExplorerUrl, getTransactionExplorerUrl } from '../config'

const contractUrl = getContractExplorerUrl('SECRET_STAKE_PLATFORM')
const txUrl = getTransactionExplorerUrl('0x123...')
```

## Updating Contract Addresses

When deploying to a new network or updating contracts:

1. Update the addresses in `contracts.ts`
2. Update the `NETWORK_CONFIG` if needed
3. All components will automatically use the new addresses

## Adding New Contracts

1. Add the address to `CONTRACT_ADDRESSES` in `contracts.ts`
2. Add metadata to `CONTRACT_INFO`
3. If the contract uses new ABI patterns, add them to `abis.ts`