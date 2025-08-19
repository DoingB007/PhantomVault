import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount } from 'wagmi'

export function FHEVMStatus() {
  const { instance, isLoading, error, initializeInstance } = useFHEVM()
  const { isConnected } = useAccount()

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center">
          <p className="text-sm text-gray-600">Initializing FHEVM...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">FHEVM Error: {error}</p>
          <button 
            onClick={initializeInstance}
            className="btn btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!instance) {
    if (!isConnected) {
      return (
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-yellow-600 mb-2">⚡ Connect wallet to enable FHEVM</p>
            <p className="text-xs text-gray-500">Please connect your wallet first</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="card">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">FHEVM not initialized</p>
          <button 
            onClick={initializeInstance}
            className="btn btn-primary text-sm"
          >
            Initialize FHEVM
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="text-center">
        <p className="text-sm text-green-600">✅ FHEVM Ready</p>
        <p className="text-xs text-gray-500">Confidential operations enabled</p>
      </div>
    </div>
  )
}