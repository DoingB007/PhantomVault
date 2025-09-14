import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle'
import { useAccount, useWalletClient } from 'wagmi'
import { initFhevm } from '../config/fhevm'

interface FHEVMContextType {
  instance: FhevmInstance | null
  isLoading: boolean
  error: string | null
  initializeInstance: () => Promise<void>
  decryptEuint64: (contractAddress: string, handle: string | Uint8Array, options?: { start?: number; days?: number }) => Promise<bigint | null>
}

const FHEVMContext = createContext<FHEVMContextType | undefined>(undefined)

interface FHEVMProviderProps {
  children: ReactNode
}

export function FHEVMProvider({ children }: FHEVMProviderProps) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()

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

  const signAuth = async (publicKey: string, contracts: string[], start: number, days: number) => {
    if (!instance) throw new Error('FHEVM instance not ready')
    if (!address) throw new Error('Wallet not connected')
    const eip712 = instance.createEIP712(publicKey, contracts, start, days)
    if (!walletClient) throw new Error('No wallet client')
    // viem walletClient signTypedData
    const signature = await walletClient.signTypedData({
      account: address as `0x${string}`,
      domain: eip712.domain as any,
      primaryType: eip712.primaryType as any,
      types: eip712.types as any,
      message: eip712.message as any,
    })
    return signature
  }

  const decryptEuint64: FHEVMContextType['decryptEuint64'] = async (contractAddress, handle, options) => {
    try {
      if (!instance) throw new Error('FHEVM instance not ready')
      if (!address) throw new Error('Wallet not connected')
      const start = options?.start ?? Math.floor(Date.now() / 1000)
      const days = options?.days ?? 7
      // Always generate fresh keypair and signature per request (no reuse)
      const { publicKey, privateKey } = instance.generateKeypair()
      const signature = await signAuth(publicKey, [contractAddress], start, days)
      const res = await instance.userDecrypt([
        { handle, contractAddress },
      ], privateKey, publicKey, signature, [contractAddress], address, start, days)
      const first = Object.values(res)[0] as bigint | string | boolean
      if (typeof first === 'bigint') return first
      if (typeof first === 'string') return BigInt(first)
      return null
    } catch (e) {
      console.error('Decrypt failed:', e)
      return null
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
    decryptEuint64,
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
