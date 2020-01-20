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
  /**
   * Creates an instance of HttpRequestNetwork.
   *
   * @param options.nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   * @param options.useMockStorage When true, will use a mock storage in memory. Meant to simplify local development and should never be used in production.
   * @param options.signatureProvider Module to handle the signature. If not given it will be impossible to create new transaction (it requires to sign).
   * @param options.persistFromLocal When true, persisting use the node only for IPFS but persisting on ethereum through local provider (given in ethereumProviderUrl).
   * @param options.ethereumProviderUrl Url of the Ethereum provider use to persist transactions if persistFromLocal is true.
   *
   */
  constructor(
    {
      decryptionProvider,
      nodeConnectionConfig,
      persistFromLocal,
      signatureProvider,
      useMockStorage,
      web3,
      ethereumProviderUrl,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      nodeConnectionConfig?: AxiosRequestConfig;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
      persistFromLocal?: boolean;
      web3?: any;
      ethereumProviderUrl?: string;
    } = {
      nodeConnectionConfig: {},
      persistFromLocal: false,
      useMockStorage: false,
    },
  ) {
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? // useMockStorage === true => use mock data-access
        new MockDataAccess(new MockStorage())
      : // useMockStorage === false
      persistFromLocal
      ? // persistFromLocal === true => use http-metamask-data-access
        new HttpMetaMaskDataAccess({ nodeConnectionConfig, web3, ethereumProviderUrl })
      : // persistFromLocal === false => use http-data-access
        new HttpDataAccess(nodeConnectionConfig);

    super(dataAccess, signatureProvider, decryptionProvider);
  }
}
