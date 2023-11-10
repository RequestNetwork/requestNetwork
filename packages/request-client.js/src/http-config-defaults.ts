import { ClientTypes } from '@requestnetwork/types';

const config: ClientTypes.IHttpDataAccessConfig = {
  requestClientVersionHeader: 'X-Request-Network-Client-Version',
  httpRequestMaxRetry: 3,
  httpRequestRetryDelay: 100,
  httpRequestExponentialBackoffDelay: 0,
  httpRequestMaxExponentialBackoffDelay: 30000,
  getConfirmationMaxRetry: 30,
  getConfirmationRetryDelay: 1000,
  getConfirmationExponentialBackoffDelay: 0,
  getConfirmationMaxExponentialBackoffDelay: 30000,
  getConfirmationDeferDelay: 3000,
};

export default config;
