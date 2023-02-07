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
 */
export type NearChainName =
  | 'aurora' // FIXME: aurora should be removed from near chains (it is a mistake)
  | 'aurora-testnet' // FIXME: aurora should be removed from near chains (it is a mistake)
  | 'near'
  | 'near-testnet';

export type ChainName = EvmChainName | BtcChainName | NearChainName;
