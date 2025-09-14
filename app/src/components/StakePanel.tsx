import { useEffect, useState } from 'react'
import { useAccount, useBalance, useContractRead } from 'wagmi'
import { ethers } from 'ethers'
import { useFHEVM } from '../hooks/useFHEVM'
import { CONTRACT_ADDRESSES } from '../config/fhevm'
import CUSDT_ABI from '../abis/cUSDT.json'
import PLATFORM_ABI from '../abis/SecretStakePlatform.json'

export function StakePanel() {
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const { instance, initializeInstance } = useFHEVM()

  // Balances
  const { data: ethBalance } = useBalance({ address })
  const { data: encryptedCUSDT, refetch: refetchCUSDT } = useContractRead({
    address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
    abi: CUSDT_ABI as any,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  const handleStake = async () => {
    if (!isConnected || !stakeAmount) return
    
    setIsStaking(true)
    try {
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
              return (
                <>
                  <span className="font-mono text-xs text-gray-500">Encrypted:</span>
                  <div className="text-[10px] text-gray-500 max-w-[220px] break-all">{enc}</div>
                </>
              )
            })()}
            <button
              onClick={() => refetchCUSDT()}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              title="Refresh balance"
            >
              ↻
            </button>
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
          disabled={!stakeAmount || isStaking}
          className="btn btn-primary btn-full"
        >
          {isStaking ? 'Staking...' : 'Stake'}
        </button>
      </div>
    </div>
  )
}
