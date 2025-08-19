import { useAccount } from 'wagmi'

export function StakeInfo() {
  const { isConnected } = useAccount()

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
          <p className="stat-value text-gray-900">***</p>
          <p className="text-sm text-gray-600">cUSDT (Encrypted)</p>
        </div>
        
        <div className="card-gray">
          <h3 className="text-sm font-medium text-gray-500">Pending Rewards</h3>
          <p className="stat-value text-green-600">***</p>
          <p className="text-sm text-gray-600">cSSC (Encrypted)</p>
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

      <button className="btn btn-success btn-full mt-4">
        Claim Rewards
      </button>
    </div>
  )
}