/**
 * List of supported EVM chains
 */
export type EvmChainName =
  | 'alfajores'
  | 'arbitrum-one'
  | 'arbitrum-rinkeby'
  | 'aurora'
  | 'aurora-testnet'
  | 'avalanche'
  | 'bsc'
  | 'bsctest'
  | 'celo'
  | 'fantom'
  | 'fuse'
  | 'goerli'
  | 'mainnet'
  | 'matic'
  | 'moonbeam'
  | 'mumbai'
  | 'near-testnet'
  | 'optimism'
  | 'private'
  | 'rinkeby'
  | 'ronin'
  | 'sokol'
  | 'tombchain'
  | 'xdai';

/**
 * List of supported BTC chains
 */
export type BtcChainName = 'mainnet' | 'testnet';

export type ChainName = EvmChainName | BtcChainName;
