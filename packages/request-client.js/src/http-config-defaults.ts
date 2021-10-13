import { ClientTypes } from '@requestnetwork/types';

const config: ClientTypes.IHttpDataAccessConfig = {
  requestClientVersionHeader: 'X-Request-Network-Client-Version',
  httpRequestMaxRetry: 3,
  httpRequestRetryDelay: 100,
  getConfirmationMaxRetry: 500,
  getConfirmationRetryDelay: 3000,
  getConfirmationDeferDelay: 3000,
};

export default config;
