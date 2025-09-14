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

// Contract addresses - update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Update these if you redeploy
  SECRET_STAKE_PLATFORM: '0xFfF3b160fE9CA69f6013F2BC1EB114DA154e5a91',
  CUSDT: '0x5a4181ed6afd6E77154AB8B18EB8fF70438456EE',
  CSSC: '0x6F8F8915053378764CeCfE58BBCbAf1EdC626C38',
} as const
