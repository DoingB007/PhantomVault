import { useAccount, useContractRead, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { useFHEVM } from '../hooks/useFHEVM'

const MOCK_USDT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const CUSDT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const FHEVM_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'euint64', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export function TokenBalances() {
  const { address, isConnected } = useAccount()
  const { instance: fhevmInstance } = useFHEVM()

  // Read USDT balance
  const { data: usdtBalance, refetch: refetchUSDT } = useContractRead({
    address: MOCK_USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // Read cUSDT balance (encrypted)
  const { data: cUSDTBalance, refetch: refetchCUSDT } = useContractRead({
    address: CUSDT_ADDRESS,
    abi: FHEVM_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  })

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Token Balances
          </h2>
          <p className="text-gray-600">
            Connect your wallet to view your token balances.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Token Balances
      </h2>
      
      <div className="space-y-3">
        {/* ETH Balance */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">Ξ</span>
            </div>
            <span className="font-medium text-gray-900">ETH</span>
          </div>
          <span className="font-mono text-sm text-gray-700">
            {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
          </span>
        </div>

        {/* USDT Balance */}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <span className="font-medium text-gray-900">USDT</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm text-gray-700">
              {usdtBalance ? parseFloat(formatEther(usdtBalance)).toFixed(2) : '0.00'}
            </span>
            <button
              onClick={() => refetchUSDT()}
              className="ml-2 text-xs text-green-600 hover:text-green-800"
              title="Refresh balance"
            >
              ↻
            </button>
          </div>
        </div>

        {/* cUSDT Balance */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">c</span>
            </div>
            <span className="font-medium text-gray-900">cUSDT</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm text-gray-700">
              {cUSDTBalance ? (
                <span className="italic">Encrypted</span>
              ) : (
                '0.00'
              )}
            </span>
            <button
              onClick={() => refetchCUSDT()}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              title="Refresh balance"
            >
              ↻
            </button>
          </div>
        </div>

        {/* FHEVM Status */}
        {!fhevmInstance && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ FHEVM not initialized. Encrypted balances cannot be decrypted.
          </div>
        )}
      </div>
    </div>
  )
}