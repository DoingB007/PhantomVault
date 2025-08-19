import { useState } from 'react'
import { useAccount, useContractWrite, useContractRead } from 'wagmi'
import { formatEther, parseEther } from 'viem'

const MOCK_USDT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const MOCK_USDT_ABI = [
  {
    inputs: [],
    name: 'claimFaucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'FAUCET_AMOUNT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canClaim',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getTotalClaims',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export function USDTFaucet() {
  const { address, isConnected } = useAccount()
  const [isClaiming, setIsClaiming] = useState(false)

  // Read faucet amount
  const { data: faucetAmount } = useContractRead({
    address: MOCK_USDT_ADDRESS,
    abi: MOCK_USDT_ABI,
    functionName: 'FAUCET_AMOUNT',
  })

  // Read user's total claims
  const { data: totalClaims, refetch: refetchClaims } = useContractRead({
    address: MOCK_USDT_ADDRESS,
    abi: MOCK_USDT_ABI,
    functionName: 'getTotalClaims',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // Check if user can claim
  const { data: canClaim } = useContractRead({
    address: MOCK_USDT_ADDRESS,
    abi: MOCK_USDT_ABI,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // Write contract for claiming
  const { writeAsync: claimFaucet } = useContractWrite({
    address: MOCK_USDT_ADDRESS,
    abi: MOCK_USDT_ABI,
    functionName: 'claimFaucet',
  })

  const handleClaimFaucet = async () => {
    if (!claimFaucet || !canClaim) return

    setIsClaiming(true)
    try {
      const tx = await claimFaucet()
      console.log('Faucet claim transaction:', tx)
      
      // Wait for transaction to be mined
      // Note: In a real app, you'd want to wait for the transaction receipt
      setTimeout(() => {
        refetchClaims()
      }, 2000)
      
    } catch (error) {
      console.error('Faucet claim failed:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            USDT Faucet
          </h2>
          <p className="text-gray-600">
            Connect your wallet to claim free USDT tokens for testing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        USDT Faucet
      </h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">Faucet Amount:</span>
            <span className="text-sm text-blue-600">
              {faucetAmount ? formatEther(faucetAmount) : '0'} USDT
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Your Total Claims:</span>
            <span className="text-sm text-blue-600">
              {totalClaims?.toString() || '0'}
            </span>
          </div>
        </div>

        <button
          onClick={handleClaimFaucet}
          disabled={!canClaim || isClaiming}
          className="btn btn-primary btn-full"
        >
          {isClaiming ? 'Claiming...' : 'Claim USDT'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Free USDT tokens for testing. No cooldown period.
        </p>
      </div>
    </div>
  )
}