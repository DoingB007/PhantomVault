/// <reference types="vite/client" />

// Extend window object for Ethereum provider
declare global {
  interface Window {
    ethereum?: any
  }
}
