import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="flex items-center">
          <h1>Secret Stake Platform</h1>
        </div>
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}