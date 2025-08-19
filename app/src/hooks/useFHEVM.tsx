import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle'
import { useAccount } from 'wagmi'
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
  const { isConnected } = useAccount()

  const initializeInstance = async () => {
    if (instance || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Initializing FHEVM instance...')
      const fhevmInstance = await initFhevm()
      if(fhevmInstance){
        console.log("fhevmInstance success!");
        setInstance(fhevmInstance)
      }

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
    // Only auto-initialize when wallet is connected
    if (isConnected && !instance && !isLoading) {
      initializeInstance()
    }
    // Clear instance when wallet is disconnected
    if (!isConnected && instance) {
      setInstance(null)
      setError(null)
      console.log('Wallet disconnected, clearing FHEVM instance')
    }
  }, [isConnected, instance, isLoading])

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