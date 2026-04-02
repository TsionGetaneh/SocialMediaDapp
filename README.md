# SocialDapp - Decentralized Social Media

A decentralized social media platform built with Solidity and React, running on the Ethereum Sepolia testnet.

## Features

- **User Registration**: Create a profile with a username, bio, and profile picture.
- **Post Creation**: Share text posts with local image selection.
- **Likes & Dislikes**: React to posts with Thumbs Up/Down.
- **Comments**: Full comment section for every post.
- **Follow System**: Follow/Unfollow other users to see their activity.
- **Messaging**: Private chat system with conversation history.
- **Search**: Find users and posts by username or content.
- **Real-time Updates**: UI updates automatically when events occur on-chain.
- **Share & Delete**: Share post links or delete your own posts.
- **Tipping**: Support your favorite creators by tipping them ETH directly.
- **MetaMask Integration**: Connect your wallet and switch to the Sepolia network.

## Tech Stack

- **Smart Contract**: Solidity ^0.8.20, Hardhat, OpenZeppelin.
- **Frontend**: React 18+, TypeScript, ethers.js v6, Tailwind CSS.
- **Icons**: Lucide-React.
- **Notifications**: React-Toastify.

## Prerequisites

- Node.js (v18+ recommended).
- MetaMask browser extension.
- Sepolia ETH (get some from a faucet like [Alchemy](https://sepoliafaucet.com/) or [Infura](https://www.infura.io/faucet/sepolia)).

## Getting Started

### 1. Clone and Install Dependencies

```bash
npm install
cd frontend
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory and add your credentials:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

### 3. Compile and Deploy

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, copy the contract address and paste it into `frontend/src/contracts-config.json`.

### 4. Run Frontend

```bash
cd frontend
npm start
```

## Folder Structure

- `contracts/`: Smart contract source code.
- `scripts/`: Deployment and interaction scripts.
- `test/`: Hardhat unit tests.
- `frontend/`: React application.
  - `src/components/`: Reusable React components.
  - `src/utils/`: Utility functions and contract helpers.
  - `src/contracts-config.json`: ABI and deployed contract address.

## License

MIT
