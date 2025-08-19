import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'Secret Stake Platform',
  projectId: 'SECRET_STAKE_PLATFORM', // You should replace this with your actual WalletConnect project ID
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})