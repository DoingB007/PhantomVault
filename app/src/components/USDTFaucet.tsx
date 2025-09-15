import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import CUSDT_ABI from '../abis/cUSDT.json'
import { CONTRACT_ADDRESSES } from '../config'

export function USDTFaucet() {
  const { address, isConnected } = useAccount()
  const [isClaiming, setIsClaiming] = useState(false)

  // Use cUSDT.mint(uint64 amount) as faucet on Sepolia
  const { writeContractAsync } = useWriteContract()

  const handleClaimFaucet = async () => {
    if (!writeContractAsync) return

    setIsClaiming(true)
    try {
      const amount = 1000n * 10n ** 6n // 1,000 cUSDT (6 decimals)
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CUSDT as `0x${string}`,
        abi: CUSDT_ABI as any,
        functionName: 'mint',
        args: [amount],
      })
      console.log('Mint cUSDT tx:', tx)
      
    } catch (error) {
      console.error('Faucet claim failed:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <button
      onClick={handleClaimFaucet}
      disabled={!isConnected || !address || isClaiming}
      className="btn btn-primary btn-full"
    >
      {isClaiming ? 'Minting 1,000 cUSDT...' : 'cUSDT Faucet'}
    </button>
  )
}
