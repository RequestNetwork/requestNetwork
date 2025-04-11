/**
 * Configuration for the Thirdweb Engine
 */
export interface ThirdwebEngineConfig {
  /**
   * The URL of your Thirdweb Engine instance
   */
  engineUrl: string;

  /**
   * The access token for Thirdweb Engine
   */
  accessToken: string;

  /**
   * The address of the wallet configured in Thirdweb Engine
   */
  backendWalletAddress: string;

  /**
   * Secret for verifying webhook signatures
   */
  webhookSecret?: string;

  /**
   * Whether to use Thirdweb Engine
   */
  enabled: boolean;
}

/**
 * Chain ID mapping for common networks
 */
export const networkToChainId: Record<string, number> = {
  mainnet: 1,
  goerli: 5,
  sepolia: 11155111,
  xdai: 100,
  private: 1337,
};

/**
 * Get the chain ID for a given network
 * @param network Network name
 * @returns Chain ID
 */
export function getChainId(network: string): number {
  return networkToChainId[network] || 1;
}
