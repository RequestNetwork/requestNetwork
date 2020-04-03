import {
  DataAccessTypes,
  DecryptionProviderTypes,
  SignatureProviderTypes,
} from '@requestnetwork/types';
import { AxiosRequestConfig } from 'axios';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';
import HttpMetaMaskDataAccess from './http-metamask-data-access';
import MockDataAccess from './mock-data-access';
import MockStorage from './mock-storage';

/**
 * Exposes RequestNetwork module configured to use http-data-access.
 */
export default class HttpRequestNetwork extends RequestNetwork {
  /** Public for test purpose */
  public _mockStorage: MockStorage | undefined;

  /**
   * Creates an instance of HttpRequestNetwork.
   *
   * @param options.nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   * @param options.useMockStorage When true, will use a mock storage in memory. Meant to simplify local development and should never be used in production.
   * @param options.signatureProvider Module to handle the signature. If not given it will be impossible to create new transaction (it requires to sign).
   * @param options.useLocalEthereumBroadcast When true, persisting use the node only for IPFS but persisting on ethereum through local provider (given in ethereumProviderUrl).
   * @param options.ethereumProviderUrl Url of the Ethereum provider use to persist transactions if useLocalEthereumBroadcast is true.
   *
   */
  constructor(
    {
      decryptionProvider,
      nodeConnectionConfig,
      useLocalEthereumBroadcast,
      signatureProvider,
      useMockStorage,
      web3,
      ethereumProviderUrl,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      nodeConnectionConfig?: AxiosRequestConfig;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
      useLocalEthereumBroadcast?: boolean;
      web3?: any;
      ethereumProviderUrl?: string;
    } = {
      nodeConnectionConfig: {},
      useLocalEthereumBroadcast: false,
      useMockStorage: false,
    },
  ) {
    let _mockStorage: MockStorage | undefined;
    if (useMockStorage) {
      _mockStorage = new MockStorage();
    }
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? // useMockStorage === true => use mock data-access
        new MockDataAccess(_mockStorage!)
      : // useMockStorage === false
      useLocalEthereumBroadcast
      ? // useLocalEthereumBroadcast === true => use http-metamask-data-access
        new HttpMetaMaskDataAccess({ nodeConnectionConfig, web3, ethereumProviderUrl })
      : // useLocalEthereumBroadcast === false => use http-data-access
        new HttpDataAccess(nodeConnectionConfig);

    super(dataAccess, signatureProvider, decryptionProvider);

    // store it for test purpose
    this._mockStorage = _mockStorage;
  }
}
