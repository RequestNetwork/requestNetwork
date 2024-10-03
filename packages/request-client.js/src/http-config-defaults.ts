import { ClientTypes } from '@requestnetwork/types';

const config: ClientTypes.IHttpDataAccessConfig = {
  requestClientVersionHeader: 'X-Request-Network-Client-Version',
  httpRequestMaxRetry: 3,
  httpRequestRetryDelay: 100,
  httpRequestExponentialBackoffDelay: 0,
  httpRequestMaxExponentialBackoffDelay: 30000,

  // Exponential backoff starting at 1s, doubling after each retry, up to a maximum of 64s and max 7 retries with an initial 3s defer delay, yielding a total of 8 calls and total timeout of 130s
  getConfirmationMaxRetry: 7,
  getConfirmationRetryDelay: 0,
  getConfirmationExponentialBackoffDelay: 1000,
  getConfirmationMaxExponentialBackoffDelay: 64000,
  getConfirmationDeferDelay: 3000,
};

export default config;
