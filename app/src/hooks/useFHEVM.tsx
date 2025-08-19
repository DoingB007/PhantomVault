import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle'
import { initFhevm } from '../config/fhevm'

interface FHEVMContextType {
  instance: FhevmInstance | null
  isLoading: boolean
  error: string | null
  initializeInstance: () => Promise<void>
}

const FHEVMContext = createContext<FHEVMContextType | undefined>(undefined)

interface FHEVMProviderProps {
  children: ReactNode
}

export function FHEVMProvider({ children }: FHEVMProviderProps) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeInstance = async () => {
    if (instance || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Initializing FHEVM instance...')
      const fhevmInstance = await initFhevm()
      setInstance(fhevmInstance)
      console.log('FHEVM instance initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize FHEVM'
      setError(errorMessage)
      console.error('Failed to initialize FHEVM:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Auto-initialize when window.ethereum is available
    if (window.ethereum) {
      initializeInstance()
    }
  }, [])

  const value: FHEVMContextType = {
    instance,
    isLoading,
    error,
    initializeInstance,
  }

  return (
    <FHEVMContext.Provider value={value}>
      {children}
    </FHEVMContext.Provider>
  )
}

export function useFHEVM() {
  const context = useContext(FHEVMContext)
  if (context === undefined) {
    throw new Error('useFHEVM must be used within a FHEVMProvider')
  }
  return context
}