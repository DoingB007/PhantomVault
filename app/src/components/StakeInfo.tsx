import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from '../config/fhevm'
import PLATFORM_ABI from '../abis/SecretStakePlatform.json'
import { useState, useEffect } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'

export function StakeInfo() {
  const { address, isConnected } = useAccount()
  const { decryptEuint64 } = useFHEVM()
  const [isDecStake, setIsDecStake] = useState(false)
  const [stakeVal, setStakeVal] = useState<bigint | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [rewardTick, setRewardTick] = useState(0)

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
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

  const refreshStake = async () => {
    setIsRefreshing(true)
    try {
      await refetchUserInfo()
      // 清空已解密的值，需要重新解密
      setStakeVal(null)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 每秒刷新一次奖励计算，让用户可以看到实时变化
  useEffect(() => {
    const interval = setInterval(() => {
      setRewardTick(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Calculate pending rewards based on staked amount and time
  const calculatePendingRewards = () => {
    if (!userInfo || stakeVal == null) {
      return 0
    }

    const lastClaimTime = Number(userInfo[2]) // lastClaimTime from userInfo
    if (lastClaimTime === 0) {
      return 0
    }

    const now = Math.floor(Date.now() / 1000)
    const elapsed = now - lastClaimTime

    // 如果刚刚操作过，没有时间间隔
    if (elapsed === 0) {
      return 0
    }

    // Constants from contract (using BigInt for precision)
    const UNIT = BigInt(10_000 * 1000000) // 10,000 USDT in wei
    const REWARD_PER_UNIT_PER_DAY = BigInt(1000000) // 1 cSSC in wei
    const SECONDS_PER_DAY = 24 * 60 * 60

    // 修改计算逻辑：不使用整数单位，而是按比例计算
    // pending = (stakedAmount / UNIT) * elapsed * REWARD_PER_UNIT_PER_DAY / DAY_SECS
    const stakedAmountNum = Number(stakeVal)
    const unitNum = Number(UNIT)
    const rewardPerUnitPerDayNum = Number(REWARD_PER_UNIT_PER_DAY)

    // 按比例计算：(质押金额 / 基准单位) * 经过秒数 * 每单位每天奖励 / 每天秒数
    const pending = (stakedAmountNum / unitNum) * elapsed * rewardPerUnitPerDayNum / SECONDS_PER_DAY

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
              return (Number(stakeVal) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 }) + ' cUSDT'
            })()
          }</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button className="text-xs text-blue-600 hover:text-blue-800" onClick={decryptStake} disabled={isDecStake}>
                解密
              </button>
              <button className="text-xs text-gray-600 hover:text-gray-800" onClick={refreshStake} disabled={isRefreshing}>
                刷新
              </button>
            </div>
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

              // Calculate and show pending rewards (rewardTick forces recalculation every second)
              const pending = calculatePendingRewards() + rewardTick * 0 // 添加rewardTick依赖但不影响计算
              return (pending / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 }) + ' cSSC'
            })()
          }</p>
          <div className="flex items-center justify-between">
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
