const bigNumber: any = require('bn.js');

/** Interface of the storage */
export interface IStorage {
  append: (data: string) => Promise<IRequestStorageAppendReturn>;
  read: (dataId: string) => Promise<IRequestStorageReadReturn>;
  getAllData: () => Promise<IRequestStorageGetAllDataReturn>;
  getAllDataId: () => Promise<IRequestStorageGetAllDataIdReturn>;
}

/** return interface for append  */
export interface IRequestStorageAppendReturn {
  /** meta information */
  meta: IRequestStorageMetaOneData;
  /** result of the execution */
  result: {
    /** data id of the data persisted */
    dataId: string;
  };
}

/** return interface for read  */
export interface IRequestStorageReadReturn {
  /** meta information */
  meta: IRequestStorageMetaOneData;
  /** result of the execution */
  result: {
    /** the data itself */
    content: string;
  };
}

/** return interface for array return */
export interface IRequestStorageGetAllDataIdReturn {
  /** meta information */
  meta: {
    /** meta of the dataIds (follow the position of the result.dataIds) */
    metaDataIds: IRequestStorageMetaOneData[];
  };
  result: {
    /** array of all data id stored */
    dataIds: string[];
  };
}

/** return interface for array return */
export interface IRequestStorageGetAllDataReturn {
  /** meta information */
  meta: {
    /** meta of the data (follow the position of the result.contents) */
    metaData: IRequestStorageMetaOneData[];
  };
  result: {
    /** array of all data stored */
    data: string[];
  };
}

/** return interface for the meta of one piece of data in the storage */
export interface IRequestStorageMetaOneData {
  /** Storage type for now only ethereum + ipfs */
  storageType?: StorageSystemType;
  /** meta about ethereum smart contract */
  ethereum?: {
    /** network id where the smart contract is deployed */
    networkId: number;
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
    /** cost in wei of the transaction that stored the data id */
    cost: typeof bigNumber;
  };
  /** meta about ipfs file */
  ipfs?: {
    /** Size in octet of the file on ipfs */
    size: number;
  };
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
}

/** Information to connect to a ipfs gateway */
export interface IIpfsGatewayConnection {
  host: string;
  port: number;
  protocol: IpfsGatewayProtocol;
  timeout: number;
}

/** Protocol to connect to ipfs */
export enum IpfsGatewayProtocol {
  HTTP = 'http',
  HTTPS = 'https',
}

/** Storage type for now only ethereum + ipfs available */
export enum StorageSystemType {
  ETHEREUM_IPFS = 'ethereumIpfs',
}
