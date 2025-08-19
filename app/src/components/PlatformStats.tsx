export function PlatformStats() {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Platform Statistics
      </h2>
      
      <div className="stats-grid">
        <div className="stat-item">
          <p className="stat-value text-indigo-600">***</p>
          <p className="stat-label">Total Staked (Encrypted)</p>
        </div>
        
        <div className="stat-item">
          <p className="stat-value text-green-600">***</p>
          <p className="stat-label">Total Rewards (Encrypted)</p>
        </div>
        
        <div className="stat-item">
          <p className="stat-value text-purple-600">***</p>
          <p className="stat-label">Active Stakers</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <h3 className="font-medium text-gray-900 mb-2">Features</h3>
        <ul className="features-list space-y-1">
          <li>🔒 Confidential staking amounts using Zama FHE</li>
          <li>🔐 Private reward calculations</li>
          <li>⚡ Real-time encrypted balance updates</li>
          <li>🎯 Proportional reward distribution</li>
        </ul>
      </div>
    </div>
  )
}