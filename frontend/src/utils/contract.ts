import { ethers } from 'ethers';
import config from '../contracts-config.json';

export const getContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(config.address, config.abi, signerOrProvider);
};

export const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

export const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const getIPFSUrl = (hash: string) => {
  if (!hash) return "";
  if (hash.startsWith("http") || hash.startsWith("data:image")) return hash;
  if (hash.startsWith("mock-") || hash.startsWith("bafybeig")) {
    return `https://picsum.photos/seed/${hash}/800/450`;
  }
  return `https://ipfs.io/ipfs/${hash}`;
};
