import { useState } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { useFHEVM } from '../hooks/useFHEVM'
import { CONTRACT_ADDRESSES } from '../config/fhevm'
import CUSDT_ABI from '../abis/cUSDT.json'

const CUSDT_ADDRESS = CONTRACT_ADDRESSES.CUSDT

// Minimal ConfidentialFungibleToken ABI subset
const CFT_ABI = CUSDT_ABI as any

export function TokenBalances() {
  const { address, isConnected } = useAccount()
  const { instance: fhevmInstance, decryptEuint64 } = useFHEVM()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedCUSDT, setDecryptedCUSDT] = useState<bigint | null>(null)

  // Read cUSDT balance (encrypted)
  const { data: encryptedCUSDT, refetch: refetchCUSDT } = useReadContract({
    address: CUSDT_ADDRESS,
    abi: CFT_ABI,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as any
  const { data: cusdtSymbol } = useReadContract({ address: CUSDT_ADDRESS, abi: CFT_ABI, functionName: 'symbol' }) as any

  const handleDecrypt = async () => {
    if (!encryptedCUSDT) return
    setIsDecrypting(true)
    try {
      const val = await decryptEuint64(CUSDT_ADDRESS, encryptedCUSDT as string)
      setDecryptedCUSDT(val)
    } finally {
      setIsDecrypting(false)
    }
  }

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

        {/* cUSDT Balance (Confidential) */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">c</span>
            </div>
            <span className="font-medium text-gray-900">{(cusdtSymbol as string) || 'cUSDT'}</span>
          </div>
          <div className="text-right">
            {(() => {
              const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
              const enc = (encryptedCUSDT as string) || ''
              if (!enc || enc.toLowerCase() === zeroHash) {
                return <span className="font-mono text-sm text-gray-700">0</span>
              }
              if (decryptedCUSDT == null) return <span className="font-mono text-sm text-gray-700">***</span>
              const human = Number(decryptedCUSDT) / 1e6
              return <span className="font-mono text-sm text-gray-900">{human.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            })()}
            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                onClick={handleDecrypt}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={isDecrypting}
              >
                解密
              </button>
              <button
                onClick={() => refetchCUSDT()}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Refresh balance"
              >
                ↻
              </button>
            </div>
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
