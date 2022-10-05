import { CurrencyInput, CurrencyManager, ICurrencyManager } from '@requestnetwork/currency';
import {
  ClientTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  SignatureProviderTypes,
} from '@requestnetwork/types';
import { AxiosRequestConfig } from 'axios';
import { PaymentNetworkOptions } from '@requestnetwork/payment-detection';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';
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
   * @param options.httpConfig Http config that will be used by the underlying data-access. @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param options.nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   * @param options.useMockStorage When true, will use a mock storage in memory. Meant to simplify local development and should never be used in production.
   * @param options.signatureProvider Module to handle the signature. If not given it will be impossible to create new transaction (it requires to sign).
   * @param options.useLocalEthereumBroadcast When true, persisting use the node only for IPFS but persisting on ethereum through local provider (given in ethereumProviderUrl).
   * @param options.currencies custom currency list
   * @param options.currencyManager custom currency manager (will override `currencies`)
   */
  constructor(
    {
      decryptionProvider,
      httpConfig,
      nodeConnectionConfig,
      signatureProvider,
      useMockStorage,
      currencies,
      currencyManager,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: AxiosRequestConfig;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
      useLocalEthereumBroadcast?: boolean;
      currencies?: CurrencyInput[];
      currencyManager?: ICurrencyManager;
      paymentOptions?: PaymentNetworkOptions;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
      useLocalEthereumBroadcast: false,
      useMockStorage: false,
    },
  ) {
    let _mockStorage: MockStorage | undefined;
    if (useMockStorage) {
      _mockStorage = new MockStorage();
    }
    const dataAccess: DataAccessTypes.IDataAccess = _mockStorage
      ? new MockDataAccess(_mockStorage)
      : new HttpDataAccess({ httpConfig, nodeConnectionConfig });

    if (!currencyManager) {
      currencyManager = new CurrencyManager(currencies || CurrencyManager.getDefaultList());
    }

    super({ dataAccess, signatureProvider, decryptionProvider, currencyManager });

    // store it for test purpose
    this._mockStorage = _mockStorage;
  }
}
