import { BigNumber } from 'ethers';
import { ConfirmationEventEmitter } from './events';

export type IIndexedTransaction = {
  hash: string;
  channelId: string;
  data?: string;
  encryptedData?: string;
  encryptionMethod?: string;
  keys?: Record<string, string>;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
  smartContractAddress: string;
  topics: string[];
  size: string;
};

export interface ITransactionSubmitter {
  initialize: () => Promise<void>;
  submit(ipfsHash: string, ipfsSize: number): Promise<any>;
  hashSubmitterAddress?: string;
  network?: string;
  creationBlockNumber?: number;
}

export interface IStorageWrite {
  initialize: () => Promise<void>;
  append: (data: string) => Promise<IAppendResult>;
}

export type IGetTransactionsResponse = {
  transactions: IIndexedTransaction[];
  blockNumber: number;
};

export interface IStorageRead {
  initialize: () => Promise<void>;
  read: (dataId: string) => Promise<IEntry>;
  readMany: (dataIds: string[]) => Promise<IEntry[]>;
  getData: (options?: ITimestampBoundaries) => Promise<IEntriesWithLastTimestamp>;
}

/** Interface of the storage */
export interface IStorage extends IStorageRead, IStorageWrite {
  _getStatus: (detailed?: boolean) => Promise<any>;
}

export interface IIndexer {
  initialize(): Promise<void>;
  getTransactionsByStorageLocation(hash: string): Promise<IGetTransactionsResponse>;
  getTransactionsByChannelId(
    channel: string,
    updatedBetween?: ITimestampBoundaries,
  ): Promise<IGetTransactionsResponse>;
  getTransactionsByTopics(topics: string[]): Promise<IGetTransactionsResponse>;
}

export type IIpfsConfig = {
  delayBetweenRetries?: number;
  url: string;
  id: string;
  maxRetries?: number;
  timeout?: number;
};

export interface IIpfsStorage {
  initialize: () => Promise<void>;
  ipfsAdd: (data: string) => Promise<IIpfsMeta>;
  getConfig(): Promise<IIpfsConfig>;
}

/** An extensible template that declares a generic meta */
export interface IWithMeta<META> {
  meta: META;
}

/** Restrict the get data research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** One entry on the storage layer */
export interface IEntry extends IWithMeta<IEntryMetadata> {
  id: string;
  content: string;
}

export type AppendResultEmitter = ConfirmationEventEmitter<IEntry>;
export type IAppendResult = IEntry & AppendResultEmitter;

/** A list of entries with the last timestamp these entries were fetched from */
export interface IEntriesWithLastTimestamp {
  entries: IEntry[];
  lastTimestamp: number;
}

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
  /** Enum of state possible for data */
  state: ContentState;
  /** meta about local storing */
  local?: ILocalMetadata;
  /** timestamp of the data */
  timestamp: number;
}

/** Local storage meta data */
export interface ILocalMetadata {
  location: string;
}

/** One entry on the ethereum smart contract */
export interface IEthereumEntry extends IWithMeta<IEthereumMetadata> {
  /** data id of the persisted data */
  hash: string;
  /** parameters used to compute fees */
  feesParameters: IFeesParameters;
  /** error encounter */
  error?: { type: ErrorEntries; message: string };
}

/** Enum of state possible for data */
export enum ErrorEntries {
  IPFS_CONNECTION_ERROR,
  INCORRECT_FILE,
  WRONG_FEES,
}

/** A list of ethereum entries with the last block timestamp these entries were fetched from */
export interface IEthereumEntriesWithLastTimestamp {
  ethereumEntries: IEthereumEntry[];
  /** the timestamp of the last block this data belongs to */
  lastTimestamp: number;
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
  /** nonce of the transaction that stored the data id */
  nonce?: number;
}

/** Ethereum network id */
export enum EthereumNetwork {
  PRIVATE = 0,
  MAINNET = 1,
  RINKEBY = 4,
  GOERLI = 5,
  SEPOLIA = 11155111,
  XDAI = 100,
}

/** Information to connect to a web3 provider */
export interface IWeb3Connection {
  web3Provider?: any;
  networkId?: EthereumNetwork;
  timeout?: number;
}

/** two blocks number */
export interface IBlockNumbersInterval {
  blockAfter: number;
  blockBefore: number;
}

/** Storage type for now only ethereum + ipfs available */
export enum StorageSystemType {
  /** Ethereum and IPFS */
  ETHEREUM_IPFS = 'ethereumIpfs',

  /** Storage in local, only used for node caching for the moment */
  LOCAL = 'local',

  /** Mock storage, in memory. Used for local development. Should not be used in production */
  IN_MEMORY_MOCK = 'inMemoryMock',
}

/** interface of ipfs object */
export interface IIpfsObject {
  ipfsLinks: any[];
  ipfsSize: number;
  content: string;
}

/** interface of ipfs meta */
export interface IIpfsMeta {
  ipfsHash: string;
  ipfsSize: number;
}

/** Configuration for the pinRequest method */
export interface IPinRequestConfiguration {
  delayBetweenCalls: number;
  maxSize: number;
  timeout: number;
}

/** Configuration for the pinRequest method */

export interface IIgnoredDataId {
  entry: IEthereumEntry;
  lastTryTimestamp: number;
  iteration: number;
  toRetry: boolean;
}

/** Gas price type */
export enum GasPriceType {
  FAST = 'fast',
  STANDARD = 'standard',
  SAFELOW = 'safeLow',
}

/** Interface of the class to retrieve gas price through a provider API */
export interface IGasPriceProvider {
  getGasPrice: (type: GasPriceType) => Promise<BigNumber | null>;
}

/** Configuration for the IPFS error handling parameters */
export interface IIpfsErrorHandlingConfiguration {
  delayBetweenRetries: number;
  maxRetries: number;
}

/** Enum of state possible for data */
export enum ContentState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}
