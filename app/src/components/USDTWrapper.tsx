import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useFHEVM } from '../hooks/useFHEVM'
import { CONTRACT_ADDRESSES, COMMON_ABIS } from '../config'

export function USDTWrapper() {
  const { address, isConnected } = useAccount()
  const { instance: fhevmInstance } = useFHEVM()
  const [wrapAmount, setWrapAmount] = useState('')
  const [unwrapAmount, setUnwrapAmount] = useState('')
  const [isWrapping, setIsWrapping] = useState(false)
  const [isUnwrapping, setIsUnwrapping] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // Read USDT balance
  const { data: usdtBalance, refetch: refetchUSDT } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
    abi: COMMON_ABIS.ERC20,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as any

  // Read USDT allowance for cUSDT contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
    abi: COMMON_ABIS.ERC20,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.CUSDT] : undefined,
    query: { enabled: !!address },
  }) as any

  // Write contract helper (wagmi v2)
  const { writeContractAsync } = useWriteContract()

  const handleApprove = async () => {
    if (!writeContractAsync || !wrapAmount) return

    setIsApproving(true)
    try {
      const amount = parseEther(wrapAmount)
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MOCK_USDT as `0x${string}`,
        abi: COMMON_ABIS.ERC20,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.CUSDT, amount],
      })
      console.log('Approval transaction:', tx)

      setTimeout(() => {
        refetchAllowance()
      }, 2000)

    } catch (error) {
      console.error('Approval failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleWrap = async () => {
    if (!writeContractAsync || !wrapAmount) return

    setIsWrapping(true)
    try {
      const amount = parseEther(wrapAmount)
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
        abi: COMMON_ABIS.WRAPPER,
        functionName: 'wrap',
        args: [amount],
      })
      console.log('Wrap transaction:', tx)

      setTimeout(() => {
        refetchUSDT()
        setWrapAmount('')
      }, 2000)

    } catch (error) {
      console.error('Wrap failed:', error)
    } finally {
      setIsWrapping(false)
    }
  }

  const handleUnwrap = async () => {
    if (!writeContractAsync || !unwrapAmount || !fhevmInstance || !address) return

    setIsUnwrapping(true)
    try {
      // Create encrypted input for the unwrap amount
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.CUSDT, address)
      input.add64(BigInt(parseEther(unwrapAmount).toString()))
      const encryptedInput = await input.encrypt()

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
        abi: COMMON_ABIS.WRAPPER,
        functionName: 'unwrap',
        args: [BigInt(encryptedInput.handles[0] as unknown as string), encryptedInput.inputProof as unknown as `0x${string}`],
      })
      console.log('Unwrap transaction:', tx)

      setTimeout(() => {
        refetchUSDT()
        setUnwrapAmount('')
      }, 2000)

    } catch (error) {
      console.error('Unwrap failed:', error)
    } finally {
      setIsUnwrapping(false)
    }
  }

  const needsApproval = wrapAmount && allowance && parseEther(wrapAmount) > allowance

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            USDT ↔ cUSDT
          </h2>
          <p className="text-gray-600">
            Connect your wallet to wrap USDT to confidential USDT (cUSDT).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        USDT ↔ cUSDT Wrapper
      </h2>
      
      <div className="space-y-6">
        {/* Wrap Section */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">Wrap USDT → cUSDT</h3>
          
          <div className="form-group">
            <label htmlFor="wrapAmount" className="form-label">
              Amount to Wrap
            </label>
            <div className="input-group">
              <input
                type="number"
                id="wrapAmount"
                value={wrapAmount}
                onChange={(e) => setWrapAmount(e.target.value)}
                className="form-input"
                placeholder="0.00"
                max={usdtBalance ? formatEther(usdtBalance) : '0'}
              />
              <div className="input-suffix">
                <span>USDT</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Available: {usdtBalance ? parseFloat(formatEther(usdtBalance)).toFixed(2) : '0.00'} USDT</span>
              <button
                onClick={() => setWrapAmount(usdtBalance ? formatEther(usdtBalance) : '0')}
                className="text-blue-600 hover:text-blue-800"
              >
                Max
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            {needsApproval && (
              <button
                onClick={handleApprove}
                disabled={!wrapAmount || isApproving}
                className="btn btn-secondary flex-1"
              >
                {isApproving ? 'Approving...' : 'Approve USDT'}
              </button>
            )}
            <button
              onClick={handleWrap}
              disabled={!wrapAmount || needsApproval || isWrapping}
              className="btn btn-primary flex-1"
            >
              {isWrapping ? 'Wrapping...' : 'Wrap to cUSDT'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Unwrap Section */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">Unwrap cUSDT → USDT</h3>
          
          {!fhevmInstance ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              ⚠️ FHEVM not initialized. Cannot unwrap encrypted tokens.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="unwrapAmount" className="form-label">
                  Amount to Unwrap
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    id="unwrapAmount"
                    value={unwrapAmount}
                    onChange={(e) => setUnwrapAmount(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                  <div className="input-suffix">
                    <span>cUSDT</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Note: You can only unwrap the amount you have in cUSDT
                </p>
              </div>

              <button
                onClick={handleUnwrap}
                disabled={!unwrapAmount || isUnwrapping}
                className="btn btn-primary btn-full"
              >
                {isUnwrapping ? 'Unwrapping...' : 'Unwrap to USDT'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
