import { useFHEVM } from '../hooks/useFHEVM'

export function FHEVMStatus() {
  const { instance, isLoading, error, initializeInstance } = useFHEVM()

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