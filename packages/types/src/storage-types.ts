/** Interface of the storage */
export interface IStorage {
  append: (data: string) => Promise<string>;
  read: (dataId: string) => Promise<string>;
  getAllData: () => Promise<string[]>;
  getAllDataId: () => Promise<string[]>;
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
