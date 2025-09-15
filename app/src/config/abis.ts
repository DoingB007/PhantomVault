// Contract ABIs configuration
// This file contains commonly used contract ABIs

export const COMMON_ABIS = {
  // Standard ERC20 ABI (commonly used functions)
  ERC20: [
    {
      inputs: [
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' }
      ],
      name: 'approve',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'owner', type: 'address' },
        { internalType: 'address', name: 'spender', type: 'address' }
      ],
      name: 'allowance',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'from', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'transferFrom',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'name',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    }
  ],

  // Wrapper contract ABI (for cUSDT)
  WRAPPER: [
    {
      inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
      name: 'wrap',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'euint64', name: 'amount', type: 'uint256' },
        { internalType: 'bytes', name: 'inputProof', type: 'bytes' }
      ],
      name: 'unwrap',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ],

  // FHE common functions
  FHE_COMMON: [
    {
      inputs: [
        { internalType: 'address', name: 'operator', type: 'address' },
        { internalType: 'uint256', name: 'untilBlock', type: 'uint256' }
      ],
      name: 'setOperator',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const

// Type definitions for ABI names
export type ABIName = keyof typeof COMMON_ABIS
export type ABI = typeof COMMON_ABIS[ABIName]

// Helper function to get ABI with type safety
export function getABI(abiName: ABIName) {
  return COMMON_ABIS[abiName]
}