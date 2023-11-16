import { CurrencyManager } from '@requestnetwork/currency';
import {
  ClientTypes,
  CurrencyTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  SignatureProviderTypes,
} from '@requestnetwork/types';
import { PaymentNetworkOptions } from '@requestnetwork/payment-detection';
import RequestNetwork from './api/request-network';
import HttpDataAccess, { NodeConnectionConfig } from './http-data-access';
import { MockDataAccess } from '@requestnetwork/data-access';
import { MockStorage } from './mock-storage';

/**
 * Exposes RequestNetwork module configured to use http-data-access.
 */
export default class HttpRequestNetwork extends RequestNetwork {
  /**
   * Creates an instance of HttpRequestNetwork.
   *
   * @param options.httpConfig Http config that will be used by the underlying data-access. @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param options.nodeConnectionConfig Configuration options to connect to the node.
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
      currencyManager,
      paymentOptions,
    }: {
      decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider;
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: Partial<NodeConnectionConfig>;
      signatureProvider?: SignatureProviderTypes.ISignatureProvider;
      useMockStorage?: boolean;
      currencyManager?: CurrencyTypes.ICurrencyManager;
      paymentOptions?: Partial<PaymentNetworkOptions>;
    } = {
      httpConfig: {},
      useMockStorage: false,
    },
  ) {
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? new MockDataAccess(new MockStorage())
      : new HttpDataAccess({ httpConfig, nodeConnectionConfig });

    if (!currencyManager) {
      currencyManager = CurrencyManager.getDefault();
    }

    super({ dataAccess, signatureProvider, decryptionProvider, currencyManager, paymentOptions });
  }
}
