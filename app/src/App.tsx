import { Header } from './components/Header'
import { StakePanel } from './components/StakePanel'
import { StakeInfo } from './components/StakeInfo'
import { PlatformStats } from './components/PlatformStats'
// import { FHEVMStatus } from './components/FHEVMStatus'
import { USDTFaucet } from './components/USDTFaucet'
// import { TokenBalances } from './components/TokenBalances'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      
      <main className="main">
        <div className="mb-8">
          <p className="text-gray-600">
            Stake confidential USDT (cUSDT) and earn confidential SecretStakeCoin (cSSC) rewards. 
            All amounts are encrypted using Zama's Fully Homomorphic Encryption.
          </p>
        </div>

        {/* FHEVM status moved into Header */}

        {/* Token balances merged into StakePanel */}

        {/* Staking Section */}
        <div className="grid grid-2 mb-8">
          <StakePanel />
          <StakeInfo />
        </div>

        <PlatformStats />

        {/* USDT Faucet at the very bottom (single button only) */}
        <div className="mt-8">
          <USDTFaucet />
        </div>
      </main>
    </div>
  )
}

export default App
