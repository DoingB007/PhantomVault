import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from '../config/fhevm'
import PLATFORM_ABI from '../abis/SecretStakePlatform.json'
import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'

export function StakeInfo() {
  const { address, isConnected } = useAccount()
  const { decryptEuint64 } = useFHEVM()
  const [isDecStake, setIsDecStake] = useState(false)
  const [stakeVal, setStakeVal] = useState<bigint | null>(null)

  const { data: userInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM as `0x${string}`,
    abi: PLATFORM_ABI as any,
    functionName: 'userInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as any

  const decryptStake = async () => {
    if (!userInfo) return
    setIsDecStake(true)
    try {
      const v = await decryptEuint64(CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM, userInfo[0] as string)
      setStakeVal(v)
    } finally {
      setIsDecStake(false)
    }
  }

  // Calculate pending rewards based on staked amount and time
  const calculatePendingRewards = () => {
    if (!userInfo || stakeVal == null) return 0

    const lastClaimTime = userInfo[2] as number // lastClaimTime from userInfo
    if (lastClaimTime === 0) return 0

    const now = Math.floor(Date.now() / 1000)
    const elapsed = now - lastClaimTime
    const daysElapsed = Math.floor(elapsed / (24 * 60 * 60))

    if (daysElapsed === 0) return 0

    // Constants from contract
    const UNIT = 10_000 * 1e6 // 10,000 USDT in wei
    const REWARD_PER_UNIT_PER_DAY = 1e6 // 1 cSSC in wei

    // Calculate: stakeUnits = floor(stakedAmount / UNIT)
    const stakeUnits = Math.floor(Number(stakeVal) / UNIT)

    // Calculate: pending = stakeUnits * daysElapsed * REWARD_PER_UNIT_PER_DAY
    const pending = stakeUnits * daysElapsed * REWARD_PER_UNIT_PER_DAY

    return pending
  }
  const handleClaim = async () => {
    try {
      if (!(window as any).ethereum) throw new Error('No wallet provider')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const platform = new ethers.Contract(CONTRACT_ADDRESSES.SECRET_STAKE_PLATFORM, PLATFORM_ABI as any, signer)
      const gasLimit = 12_000_000n
      const tx = await platform.claimRewards({ gasLimit })
      console.log('Claim tx:', tx.hash)
      await tx.wait()
      console.log('Claim confirmed')
    } catch (e) {
      console.error('Claim failed:', e)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Your Staking Info
      </h2>
      
      <div className="grid grid-2">
        <div className="card-gray">
          <h3 className="text-sm font-medium text-gray-500">Staked Amount</h3>
          <p className="stat-value text-gray-900">{
            (() => {
              const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
              const encryptedStake = userInfo ? userInfo[0] as string : ''

              // If it's a zero hash or empty, show 0
              if (!encryptedStake || encryptedStake.toLowerCase() === zeroHash) {
                return '0'
              }

              // If not decrypted yet, show ***
              if (stakeVal == null) {
                return '***'
              }

              // Show decrypted value
              return (Number(stakeVal) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 })
            })()
          }</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">cUSDT (Encrypted)</p>
            <button className="text-xs text-blue-600 hover:text-blue-800" onClick={decryptStake} disabled={isDecStake}>
              解密
            </button>
          </div>
        </div>
        
        <div className="card-gray">
          <h3 className="text-sm font-medium text-gray-500">Pending Rewards</h3>
          <p className="stat-value text-green-600">{
            (() => {
              // If staked amount is not decrypted yet, show ***
              if (stakeVal == null) {
                return '***'
              }

              // Calculate and show pending rewards
              const pending = calculatePendingRewards()
              return (pending / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 })
            })()
          }</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">cSSC (Calculated)</p>
            {stakeVal !== null && (
              <span className="text-xs text-gray-500">
                Auto-calculated
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">APY</span>
          <span className="text-sm font-medium text-gray-900">~100%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Reward Rate</span>
          <span className="text-sm font-medium text-gray-900">1 cSSC per block</span>
        </div>
      </div>

      <button className="btn btn-success btn-full mt-4" onClick={handleClaim}>
        Claim Rewards
      </button>
    </div>
  )
}
