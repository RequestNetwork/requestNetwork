import { ClientTypes } from '@requestnetwork/types';

const config: ClientTypes.IHttpDataAccessConfig = {
  REQUEST_CLIENT_VERSION_HEADER: 'X-Request-Network-Client-Version',
  HTTP_REQUEST_MAX_RETRY: 3,
  HTTP_REQUEST_RETRY_DELAY: 100,
  GET_CONFIRMATION_MAX_RETRY: 500,
  GET_CONFIRMATION_RETRY_DELAY: 3000,
  GET_CONFIRMATION_DEFER_DELAY: 3000,
};

export default config;
