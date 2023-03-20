/**
 * List of supported EVM chains
 */
export type EvmChainName =
  | 'alfajores'
  | 'arbitrum-one'
  | 'arbitrum-rinkeby'
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
  | 'optimism'
  | 'private'
  | 'rinkeby' // FIXME: Rinkeby is deprecated
  | 'ronin'
  | 'sokol'
  | 'tombchain'
  | 'xdai';

/**
 * List of supported BTC chains
 */
export type BtcChainName = 'mainnet' | 'testnet';

/**
 * List of supported NEAR chains
 * FIXME: get rid of the wrong 'aurora' alias
 */
export type NearChainName = 'aurora' | 'aurora-testnet' | 'near' | 'near-testnet';

export type ChainName = EvmChainName | BtcChainName | NearChainName;

/**
 * Virtual machin chains, where payment proxy contracts can be deployed
 */
export type VMChainName = EvmChainName | NearChainName;
