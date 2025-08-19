import { useState } from 'react'
import { useAccount } from 'wagmi'

export function StakePanel() {
  const { isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)

  const handleStake = async () => {
    if (!isConnected || !stakeAmount) return
    
    setIsStaking(true)
    try {
      // TODO: Implement stake logic with FHE
      console.log('Staking:', stakeAmount)
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
            Connect Wallet to Stake
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to start staking cUSDT and earn cSSC rewards.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Stake cUSDT
      </h2>
      
      <div className="space-y-4">
        <div className="form-group">
          <label htmlFor="stakeAmount" className="form-label">
            Amount to Stake
          </label>
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