import { Header } from './components/Header'
import { StakePanel } from './components/StakePanel'
import { StakeInfo } from './components/StakeInfo'
import { PlatformStats } from './components/PlatformStats'
import { FHEVMStatus } from './components/FHEVMStatus'
import { USDTFaucet } from './components/USDTFaucet'
import { TokenBalances } from './components/TokenBalances'
import { USDTWrapper } from './components/USDTWrapper'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      
      <main className="main">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secret Stake Platform
          </h1>
          <p className="text-gray-600">
            Stake confidential USDT (cUSDT) and earn confidential SecretStakeCoin (cSSC) rewards. 
            All amounts are encrypted using Zama's Fully Homomorphic Encryption.
          </p>
        </div>

        <div className="mb-4">
          <FHEVMStatus />
        </div>

        {/* Token Management Section */}
        <div className="grid grid-3 mb-8">
          <USDTFaucet />
          <TokenBalances />
          <USDTWrapper />
        </div>

        {/* Staking Section */}
        <div className="grid grid-2 mb-8">
          <StakePanel />
          <StakeInfo />
        </div>

        <PlatformStats />
      </main>
    </div>
  )
}

export default App
