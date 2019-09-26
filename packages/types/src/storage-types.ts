const bigNumber: any = require('bn.js');

/** Interface of the storage */
export interface IStorage {
  initialize: () => Promise<void>;
  append: (data: string) => Promise<IResultDataIdWithMeta>;
  read: (dataId: string) => Promise<IResultContentWithMeta>;
  readMany: (dataIds: string[]) => Promise<IResultContentWithMeta[]>;
  getData: (options?: ITimestampBoundaries) => Promise<IResultEntriesWithMeta>;
}

/** An extensible template that declares a generic meta */
export interface IWithMeta {
  meta: any;
}

/** A template interface for return values with data and metadata */
export interface IResponseWithMeta<META, DATA> extends IWithMeta {
  meta: META;
  data: DATA;
}

/** A template interface for result values with data and metadata */
export interface IResultWithMeta<META, DATA> extends IWithMeta {
  meta: META;
  result: DATA;
}

/** Restrict the get data research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** Response with one entry DataId and meta */
export type IResultDataIdWithMeta = IResultWithMeta<IEntryMetadata, { dataId: string }>;

/** Response with one entry content and meta */
export type IResultContentWithMeta = IResultWithMeta<IEntryMetadata, { content: string }>;

/** Response with one entry dataId and content, with meta  */
export type IResultEntryWithMeta = IResultWithMeta<
  IEntryMetadata,
  { dataId: string; content: string }
>;

/** Response with many entries dataId and content, with meta  */
export type IResultEntriesWithMeta = IResultWithMeta<
  /** Metadata */
  IEntryMetadata[],
  {
    /** The list of data ids */
    dataIds: string[];
    /** The list of data contents */
    contents: string[];
    /** The last timestamp boundary this data belongs to */
    lastTimestamp?: number;
  }
>;

/** return interface for the meta of one piece of data in the storage */
export interface IEntryMetadata {
  /** Storage type for now only ethereum + ipfs */
  storageType?: StorageSystemType;
  /** meta about ethereum smart contract */
  ethereum?: IEthereumMetadata;
  /** IPFS file metadata */
  ipfs?: {
    /** Size in bytes of the file on ipfs */
    size: number;
  };
  /** timestamp of the data */
  timestamp: number;
}

/** return interface for getAllHashesAndSizes() */
export interface IGetAllHashesAndSizes {
  /** meta information */
  meta: IEthereumMetadata;
  /** data id of the persisted data */
  hash: string;
  /** parameters used to compute fees */
  feesParameters: IFeesParameters;
  /** timestamp of the data */
  timestamp: number;
}

/** Metadata about Ethereum block timestamp */
export interface IEthereumTimestampMeta {
  /** the timestamp of the last block this data belongs to */
  lastBlockTimestamp: number;
}

/** Parameters used to compute the fees */
export interface IFeesParameters {
  contentSize: number;
}

/** Ethereum storage meta data */
export interface IEthereumMetadata {
  /** network name where the smart contract is deployed */
  networkName: string;
  /** Smart contract address where is stored the data id */
  smartContractAddress: string;
  /** hash of the transaction that stored the data id */
  transactionHash: string;
  /** block number of the transaction that stored the data id */
  blockNumber: number;
  /** block timestamp of the transaction that stored the data id */
  blockTimestamp: number;
  /** number of block confirmation of the transaction */
  blockConfirmation: number;
  /** total cost (request fee + gas fee) in wei of the transaction that stored the data id */
  cost?: string;
  /** request fee in wei of the transaction that stored the data id */
  fee?: string;
  /** gas fee in wei of the transaction that stored the data id */
  gasFee?: string;
}

/** Ethereum network id */
export enum EthereumNetwork {
  PRIVATE = 0,
  MAINNET = 1,
  RINKEBY = 4,
  KOVAN = 42,
}

/** Information to connect to a web3 provider */
export interface IWeb3Connection {
  web3Provider?: any;
  networkId?: EthereumNetwork;
  timeout?: number;
}

/** Information to connect to a ipfs gateway */
export interface IIpfsGatewayConnection {
  host: string;
  port: number;
  protocol: IpfsGatewayProtocol;
  timeout: number;
}

/** two blocks number */
export interface IBlockNumbersInterval {
  blockAfter: number;
  blockBefore: number;
}

/** Protocol to connect to ipfs */
export enum IpfsGatewayProtocol {
  HTTP = 'http',
  HTTPS = 'https',
}

/** Storage type for now only ethereum + ipfs available */
export enum StorageSystemType {
  /** Ethereum and IPFS */
  ETHEREUM_IPFS = 'ethereumIpfs',

  /** Mock storage, in memory. Used for local development. Should not be used in production */
  IN_MEMORY_MOCK = 'inMemoryMock',
}

/** interface of ipfs object */
export interface IIpfsObject {
  ipfsLinks: any[];
  ipfsSize: number;
  content: string;
}

/** Configuration for the pinRequest method */
export interface IPinRequestConfiguration {
  delayBetweenCalls: number;
  maxSize: number;
  timeout: number;
}

/** Gas price type */
export enum GasPriceType {
  FAST = 'fast',
  STANDARD = 'standard',
  SAFELOW = 'safeLow',
}

/** Interface of the class to retrieve gas price through a provider API */
export interface IGasPriceProvider {
  providerUrl: string;
  getGasPrice: (type: GasPriceType) => Promise<typeof bigNumber>;
}

/** Configuration for the IPFS error handling parameters */
export interface IIpfsErrorHandlingConfiguration {
  delayBetweenRetries: number;
  maxRetries: number;
}
