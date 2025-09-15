import { useState } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { useFHEVM } from '../hooks/useFHEVM'
import { CONTRACT_ADDRESSES } from '../config'
import CUSDT_ABI from '../abis/cUSDT.json'
import CSSC_ABI from '../abis/CSecretStakeCoin.json'
import PLATFORM_ABI from '../abis/SecretStakePlatform.json'

export function StakePanel() {
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const { instance, initializeInstance, decryptEuint64 } = useFHEVM()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedCUSDT, setDecryptedCUSDT] = useState<bigint | null>(null)
  const [decryptedCSSC, setDecryptedCSSC] = useState<bigint | null>(null)
  // const [isCheckingOperator, setIsCheckingOperator] = useState(false)
  const [isSettingOperator, setIsSettingOperator] = useState(false)

  // Balances
  const { data: ethBalance } = useBalance({ address })
  const { data: encryptedCUSDT, refetch: refetchCUSDT } = useReadContract({
    address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
    abi: CUSDT_ABI as any,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as any

  // cSSC balance
  const { data: encryptedCSSC, refetch: refetchCSSC } = useReadContract({
    address: CONTRACT_ADDRESSES.CSSC as `0x${string}`,
    abi: CSSC_ABI as any,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as any

  // Check if platform is operator for user
  const { data: isOperator, refetch: refetchOperator } = useReadContract({
    address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
    abi: CUSDT_ABI as any,
    functionName: 'isOperator',
    args: address ? [address, CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM] : undefined,
    query: { enabled: !!address },
  }) as any

  const handleDecryptCUSDT = async () => {
    if (!encryptedCUSDT) return
    setIsDecrypting(true)
    try {
      const val = await decryptEuint64(CONTRACT_ADDRESSES.CUSDT, encryptedCUSDT as string)
      setDecryptedCUSDT(val)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleDecryptCSSC = async () => {
    if (!encryptedCSSC) return
    setIsDecrypting(true)
    try {
      const val = await decryptEuint64(CONTRACT_ADDRESSES.CSSC, encryptedCSSC as string)
      setDecryptedCSSC(val)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleSetOperator = async () => {
    if (!isConnected) return

    setIsSettingOperator(true)
    try {
      if (!(window as any).ethereum) throw new Error('No wallet provider')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()

      // Set operator with 1 year validity (approximately)
      const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60

      const cusdtContract = new ethers.Contract(CONTRACT_ADDRESSES.CUSDT, CUSDT_ABI as any, signer)
      const tx = await cusdtContract.setOperator(CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM, until)
      console.log('SetOperator tx:', tx.hash)
      await tx.wait()
      console.log('SetOperator confirmed')

      // Refresh operator status
      await refetchOperator()
    } catch (error) {
      console.error('Setting operator failed:', error)
    } finally {
      setIsSettingOperator(false)
    }
  }

  const handleStake = async () => {
    if (!isConnected || !stakeAmount) return

    setIsStaking(true)
    try {
      // 0) Check if platform is operator, if not, set it first
      if (!isOperator) {
        console.log('Platform is not operator, setting operator first...')
        await handleSetOperator()

        // Wait a bit for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Refresh operator status
        await refetchOperator()

        // Check again
        const updatedOperatorStatus = await refetchOperator()
        if (!updatedOperatorStatus.data) {
          throw new Error('Failed to set operator permission')
        }
      }

      // 1) Init FHE instance if needed
      if (!instance) {
        await initializeInstance()
      }
      if (!instance) throw new Error('FHEVM instance not ready')

      // 2) Parse amount (6 decimals)
      const value = BigInt(stakeAmount)
      if (value <= 0n) throw new Error('Invalid amount')
      const amount = value * 10n ** 6n

      // 3) Get signer
      if (!(window as any).ethereum) throw new Error('No wallet provider')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const user = await signer.getAddress()

      // 4) Create encrypted input for platform
      const enc = await instance
        .createEncryptedInput(CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM, user)
        .add64(amount)
        .encrypt()

      // 5) Send stake tx
      const platform = new ethers.Contract(CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM, PLATFORM_ABI as any, signer)
      const gasLimit = 12_000_000n
      const tx = await platform.stake(enc.handles[0], enc.inputProof, { gasLimit })
      console.log('Stake tx:', tx.hash)
      await tx.wait()
      console.log('Stake confirmed')
    } catch (error) {
      console.error('Staking failed:', error)
    } finally {
      setIsStaking(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Wallet to View & Stake
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to view balances and start staking cUSDT.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Balances & Stake</h2>

      {/* Balances */}
      <div className="space-y-3 mb-6">
        {/* ETH */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">Ξ</span>
            </div>
            <span className="font-medium text-gray-900">ETH</span>
          </div>
          <span className="font-mono text-sm text-gray-700">
            {ethBalance ? Number(ethers.formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
          </span>
        </div>

        {/* cUSDT (confidential) */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">c</span>
            </div>
            <span className="font-medium text-gray-900">cUSDT</span>
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
                onClick={handleDecryptCUSDT}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={isDecrypting}
              >
                Decrypt
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

        {/* cSSC (reward token) */}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-medium text-gray-900">cSSC</span>
          </div>
          <div className="text-right">
            {(() => {
              const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
              const enc = (encryptedCSSC as string) || ''
              if (!enc || enc.toLowerCase() === zeroHash) {
                return <span className="font-mono text-sm text-gray-700">0</span>
              }
              if (decryptedCSSC == null) return <span className="font-mono text-sm text-gray-700">***</span>
              const human = Number(decryptedCSSC) / 1e6
              return <span className="font-mono text-sm text-gray-900">{human.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            })()}
            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                onClick={handleDecryptCSSC}
                className="text-xs text-green-600 hover:text-green-800"
                disabled={isDecrypting}
              >
                Decrypt
              </button>
              <button
                onClick={() => refetchCSSC()}
                className="text-xs text-green-600 hover:text-green-800"
                title="Refresh balance"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="form-group">
          <label htmlFor="stakeAmount" className="form-label">Amount to Stake</label>
          <div className="input-group">
            <input
              type="number"
              id="stakeAmount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="form-input"
              placeholder="0.00"
            />
            <div className="input-suffix">
              <span>cUSDT</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStake}
          disabled={!stakeAmount || isStaking || isSettingOperator}
          className="btn btn-primary btn-full"
        >
          {isStaking ?
            (!isOperator ? 'Setting Permission & Staking...' : 'Staking...') :
            'Stake'}
        </button>

        {/* Operator Permission Section */}
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Platform Permission</span>
              {isOperator ? (
                <span
                  className="text-xs font-medium"
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#f0fdf4',
                    color: '#065f46'
                  }}
                >
                  ✓ Authorized
                </span>
              ) : (
                <span
                  className="text-xs font-medium"
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706'
                  }}
                >
                  ⚠ Required
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            The platform needs permission to transfer your cUSDT during staking operations.
          </p>

          {!isOperator && (
            <button
              onClick={handleSetOperator}
              disabled={isSettingOperator}
              className="btn btn-success btn-full"
              style={{
                backgroundColor: isSettingOperator ? '#9ca3af' : '#059669',
                cursor: isSettingOperator ? 'not-allowed' : 'pointer'
              }}
            >
              {isSettingOperator ? 'Setting Permission...' : 'Grant Platform Permission'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
