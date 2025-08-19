# Secret Stake Platform

A fully confidential staking platform built with Zama's Fully Homomorphic Encryption (FHE) technology. Stake encrypted USDT tokens and earn encrypted cSSC rewards while keeping all amounts completely private.

## 🔐 Features

- **Complete Privacy**: All staking amounts and rewards are encrypted end-to-end
- **Encrypted Token Operations**: Stake, withdraw, and claim rewards without revealing amounts
- **FHE Technology**: Built on Zama's cutting-edge Fully Homomorphic Encryption
- **User-Friendly Interface**: Web-based interface for easy interaction
- **Transparent Rewards**: Fair reward distribution based on staking time and amount
- **Secure Architecture**: Multi-layered security with on-chain verification

## 🏗️ Architecture

### Smart Contracts

1. **MockUSDT**: Standard ERC20 token for testing purposes
2. **cUSDT**: Confidential USDT wrapper using FHE encryption
3. **CSecretStakeCoin (cSSC)**: Encrypted reward token with minting capabilities
4. **SimpleSecretStakePlatform**: Main staking contract handling all encrypted operations

### Technology Stack

- **Smart Contracts**: Solidity ^0.8.27 with Zama FHE library
- **Development Framework**: Hardhat with FHEVM plugin
- **Frontend**: HTML/CSS/JavaScript with Ethers.js
- **Encryption**: Zama FHEVM with confidential computing
- **Testing**: Comprehensive test suite with encrypted operations
- **Deployment**: Automated deployment scripts for multiple networks

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MetaMask wallet
- Sepolia testnet ETH
- Git

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd SecretStakePlatform
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY  # Optional
   ```

3. **Compile Contracts**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Deploy to Sepolia**
   ```bash
   npx hardhat deploy --network sepolia --tags SecretStakePlatform
   ```

6. **Start Frontend**
   ```bash
   cd app
   npx http-server -p 8000
   # Visit http://localhost:8000
   ```

## 📁 Project Structure

```
SecretStakePlatform/
├── contracts/                     # Smart contracts
│   ├── MockUSDT.sol              # Test USDT token
│   ├── cUSDT.sol                 # Confidential USDT wrapper
│   ├── cSecretStakeCoin.sol      # Encrypted reward token
│   └── SimpleSecretStakePlatform.sol # Main staking contract
├── deploy/                        # Deployment scripts
│   ├── deploySecretStakePlatform.ts
│   └── deployForTesting.ts
├── test/                         # Test files
│   ├── BasicTests.ts             # Core functionality tests
│   ├── SimpleSecretStakePlatform.ts # Advanced staking tests
│   └── Tokens.ts                 # Token operation tests
├── app/                          # Frontend interface
│   ├── index.html               # Main web interface
│   ├── styles.css              # Styling
│   ├── contracts.js            # Contract configuration
│   ├── app.js                  # Application logic
│   └── README.md               # Frontend documentation
├── docs/                        # Technical documentation
│   ├── zama_llm.md            # FHE contract development guide
│   └── zama_doc_relayer.md    # Relayer SDK documentation
└── CLAUDE.md                   # Project instructions
```

## 💡 How It Works

### 1. Token Wrapping
Users convert regular USDT to encrypted cUSDT using the confidential wrapper contract.

```solidity
// Wrap USDT to cUSDT
await mockUSDT.approve(cUSDTAddress, amount);
await cUSDT.wrap(userAddress, amount);
```

### 2. Encrypted Staking
Users stake their encrypted cUSDT without revealing the amount.

```solidity
// Create encrypted input
const input = fhevm.createEncryptedInput(contractAddress, userAddress);
input.add64(stakeAmount);
const encryptedInput = await input.encrypt();

// Stake with encrypted amount
await stakingPlatform.stake(encryptedInput.handles[0], encryptedInput.inputProof);
```

### 3. Private Reward Distribution
Rewards are calculated and distributed using FHE operations, keeping all amounts private.

```solidity
// Calculate rewards on encrypted data
euint64 userReward = FHE.select(
    hasStaked,
    calculateEncryptedReward(user.stakedAmount, timeStaked),
    euint64.wrap(bytes32(0))
);
```

### 4. Encrypted Balances
All user balances remain encrypted, visible only to authorized parties.

## 🎯 Use Cases

### Individual Users
- **Private Staking**: Stake tokens without revealing portfolio size
- **Anonymous Rewards**: Earn rewards while maintaining financial privacy
- **Confidential Trading**: Participate in DeFi without exposing strategies

### Institutions
- **Regulatory Compliance**: Meet privacy requirements while maintaining transparency
- **Competitive Advantage**: Keep trading strategies and positions private
- **Risk Management**: Monitor exposure without revealing specific amounts

### DeFi Protocols
- **Privacy-First Design**: Integrate confidential staking into existing protocols
- **Enhanced Security**: Reduce attack vectors by hiding valuable information
- **User Attraction**: Attract privacy-conscious users and institutions

## 🔧 Development Guide

### Testing Strategy

The project includes comprehensive tests covering:

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Cross-contract interactions
- **FHE Tests**: Encrypted operation verification
- **Error Handling**: Edge cases and failure scenarios

Run specific test suites:
```bash
npx hardhat test test/BasicTests.ts        # Basic functionality
npx hardhat test test/Tokens.ts            # Token operations
npx hardhat test test/SimpleSecretStakePlatform.ts # Full platform tests
```

### Deployment Process

1. **Local Testing**
   ```bash
   npx hardhat node
   npx hardhat deploy --network localhost
   ```

2. **Testnet Deployment**
   ```bash
   npx hardhat deploy --network sepolia --tags SecretStakePlatform
   ```

3. **Contract Verification**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

4. **Frontend Configuration**
   Update contract addresses in `app/contracts.js` after deployment.

### Security Considerations

- **FHE Access Control**: Proper ACL management for encrypted data
- **Reentrancy Protection**: Guards against recursive calls
- **Overflow Protection**: Safe arithmetic operations
- **Input Validation**: Comprehensive parameter checking
- **Emergency Functions**: Owner-only emergency withdrawal capabilities

## 📊 Economics Model

### Reward Mechanism
- **Base Rate**: 0.1 cSSC per block per staked amount
- **Time-Based**: Longer staking periods earn more rewards
- **Proportional**: Rewards proportional to staked amount
- **Encrypted**: All reward calculations happen on encrypted data

### Token Supply
- **cSSC**: Unlimited supply, minted as rewards
- **cUSDT**: 1:1 wrapped from USDT
- **Inflation**: Controlled by staking reward rate

### Fee Structure
- **Staking**: No fees for staking operations
- **Withdrawal**: No withdrawal fees
- **Rewards**: No fees for claiming rewards
- **Gas**: Users pay standard Ethereum gas fees

## 🛡️ Security & Privacy

### Privacy Guarantees
- **Amount Privacy**: Staking amounts never revealed on-chain
- **Balance Privacy**: User balances encrypted with FHE
- **Activity Privacy**: Transaction patterns obscured
- **Reward Privacy**: Reward amounts kept confidential

### Security Measures
- **Smart Contract Auditing**: Comprehensive security review needed
- **FHE Verification**: Cryptographic proof verification
- **Access Control**: Role-based permission system
- **Emergency Procedures**: Multi-signature emergency controls

### Known Limitations
- **Gas Costs**: FHE operations require more gas
- **Complexity**: Higher development and maintenance complexity
- **Early Technology**: FHE is cutting-edge technology
- **Testing Phase**: Extensive testing required before mainnet

## 📈 Roadmap

### Phase 1: Foundation (Current)
- [x] Core smart contract development
- [x] Basic FHE integration
- [x] Testing framework
- [x] Simple web interface

### Phase 2: Enhancement
- [ ] Advanced frontend features
- [ ] Mobile responsiveness
- [ ] Batch operations support
- [ ] Performance optimization

### Phase 3: Production
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Advanced analytics
- [ ] Governance features

### Phase 4: Expansion
- [ ] Multi-token support
- [ ] Cross-chain integration
- [ ] Institutional features
- [ ] Mobile applications

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- Follow Solidity style guide
- Write comprehensive tests
- Document all functions
- Use meaningful commit messages

### Testing Requirements
- All new features must have tests
- Tests must pass on local and testnet
- Coverage should remain above 80%

## 📚 Documentation

### Smart Contract Documentation
- [Zama FHE Guide](docs/zama_llm.md): Comprehensive FHE development guide
- [Relayer SDK](docs/zama_doc_relayer.md): Frontend integration documentation
- [Project Instructions](CLAUDE.md): Development guidelines

### External Resources
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol](https://docs.zama.ai/protocol)
- [Solidity Guides](https://docs.zama.ai/protocol/solidity-guides)

## 🆘 Support & Community

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Discord**: Join the Zama community discord
- **Documentation**: Comprehensive guides and tutorials

### Community
- **Zama Discord**: Technical discussions and support
- **GitHub Discussions**: Feature requests and ideas
- **Twitter**: Follow @zama_fhe for updates

## ⚠️ Disclaimers

### Development Status
This project is in active development and should be considered experimental. Not recommended for production use without thorough security auditing.

### Financial Risks
- Smart contracts may contain bugs
- FHE technology is experimental
- Gas costs may be high
- Regulatory compliance varies by jurisdiction

### Technical Risks
- FHE operations require significant computational resources
- Network congestion may affect performance
- Key management is critical for security

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Team**: For pioneering FHE technology and excellent documentation
- **OpenZeppelin**: For secure smart contract standards
- **Hardhat Team**: For excellent development tools
- **Ethereum Community**: For the robust ecosystem

---

**Built with 🔐 privacy and ❤️ by the Secret Stake Platform team**

*Enabling private DeFi with cutting-edge cryptography*