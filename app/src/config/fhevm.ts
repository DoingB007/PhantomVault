import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';

export const initFhevm = async () => {
  // if (typeof window !== 'undefined' && (window as any).fhevm) {
  try {
    // Initialize the SDK first
    await initSDK()

    // Initialize the FHEVM instance for Sepolia testnet
    const config = {
      ...SepoliaConfig,
      // Use the browser's ethereum provider
      network: window.ethereum,
    }

    const instance = await createInstance(config)
    return instance
    // }
  } catch (error) {
    console.error(error);
  }

}

// FHEVM instance initialization
// This file handles FHEVM initialization for the Sepolia testnet
