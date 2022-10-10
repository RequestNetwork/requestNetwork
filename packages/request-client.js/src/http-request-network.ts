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
  /**
   * Creates an instance of HttpRequestNetwork.
   *
   * @param options.httpConfig Http config that will be used by the underlying data-access. @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param options.nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   * @param options.useMockStorage When true, will use a mock storage in memory. Meant to simplify local development and should never be used in production.
   * @param options.signatureProvider Module to handle the signature. If not given it will be impossible to create new transaction (it requires to sign).
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
      paymentOptions,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: AxiosRequestConfig;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
      currencies?: CurrencyInput[];
      currencyManager?: ICurrencyManager;
      paymentOptions?: PaymentNetworkOptions;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
      useMockStorage: false,
    },
  ) {
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? new MockDataAccess(new MockStorage())
      : new HttpDataAccess({ httpConfig, nodeConnectionConfig });

    if (!currencyManager) {
      currencyManager = new CurrencyManager(currencies || CurrencyManager.getDefaultList());
    }

    super({ dataAccess, signatureProvider, decryptionProvider, currencyManager, paymentOptions });
  }
}
