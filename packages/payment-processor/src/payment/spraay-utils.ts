/**
 * Spraay Protocol contract addresses, chain constants, and ABIs
 * for the batch payment integration.
 */

/** Spraay SprayContract addresses (batch transfer) by chain ID */
export const SPRAAY_BATCH_CONTRACTS: Record<number, string> = {
  8453: "0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC", // Base
  1: "0x15E7aEDa45094DD2E9E746FcA1C726cAd7aE58b3", // Ethereum
  42161: "0x5be43aA67804aD84fcb890d0AE5F257fb1674302", // Arbitrum
  137: "0x6d2453ab7416c99aeDCA47CF552695be5789D7ff", // Polygon
  56: "0x3093a2951FB77b3beDfB8BA20De645F7413432C1", // BNB Chain
  43114: "0x6A41Fb5F5CfE632f9446b548980dA6cE2d75afcC", // Avalanche
};

/** USDC contract addresses by chain ID */
export const USDC_ADDRESSES: Record<number, string> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB Chain
  43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Avalanche
};

/** Block explorer URLs by chain ID */
export const EXPLORER_URLS: Record<number, string> = {
  8453: "https://basescan.org/tx/",
  1: "https://etherscan.io/tx/",
  42161: "https://arbiscan.io/tx/",
  137: "https://polygonscan.com/tx/",
  56: "https://bscscan.com/tx/",
  43114: "https://snowtrace.io/tx/",
};

/** Human-readable chain names */
export const CHAIN_NAMES: Record<number, string> = {
  8453: "Base",
  1: "Ethereum",
  42161: "Arbitrum One",
  137: "Polygon",
  56: "BNB Chain",
  43114: "Avalanche",
};

/** Minimal ERC-20 ABI for approve, allowance, balanceOf, decimals */
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

/** Spraay SprayContract ABI — batch transfer functions */
export const SPRAAY_BATCH_ABI = [
  "function batchTransfer(address token, address[] calldata recipients, uint256[] calldata amounts) external",
  "function batchTransferWithReferences(address token, address[] calldata recipients, uint256[] calldata amounts, bytes32[] calldata references) external",
];
