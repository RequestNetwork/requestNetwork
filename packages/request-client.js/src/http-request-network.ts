import {
  DataAccessTypes,
  DecryptionProviderTypes,
  SignatureProviderTypes,
} from '@requestnetwork/types';
import { AxiosRequestConfig } from 'axios';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';
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
   */
  constructor(
    {
      decryptionProvider,
      nodeConnectionConfig,
      signatureProvider,
      useMockStorage,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      nodeConnectionConfig?: AxiosRequestConfig;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
    } = {
      nodeConnectionConfig: {},
      useMockStorage: false,
    },
  ) {
    // useMockStorage === true => use mock data-access
    // useMockStorage === false => use http data-access
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? new MockDataAccess(new MockStorage())
      : new HttpDataAccess(nodeConnectionConfig);

    super(dataAccess, signatureProvider, decryptionProvider);
  }
}
