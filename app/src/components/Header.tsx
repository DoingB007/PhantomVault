import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount } from 'wagmi'

export function Header() {
  const { instance, isLoading, error, initializeInstance } = useFHEVM()
  const { isConnected } = useAccount()

  const Status = () => {
    if (isLoading) {
      return <span className="text-xs text-gray-500 mr-3">FHEVM...</span>
    }
    if (error) {
      return (
        <button onClick={initializeInstance} className="text-xs text-red-600 mr-3 hover:underline">
          FHEVM Error · Retry
        </button>
      )
    }
    if (!instance) {
      if (!isConnected) return null
      return (
        <button onClick={initializeInstance} className="text-xs text-amber-600 mr-3 hover:underline">
          Init FHEVM
        </button>
      )
    }
    return <span className="text-xs text-green-600 mr-3">FHEVM Ready</span>
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="flex items-center">
          <h1>Secret Stake Platform</h1>
        </div>
        <div className="flex items-center">
          <Status />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
