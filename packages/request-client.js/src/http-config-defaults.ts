import { ClientTypes } from '@requestnetwork/types';

const config: ClientTypes.IHttpDataAccessConfig = {
  REQUEST_CLIENT_VERSION_HEADER: 'X-Request-Network-Client-Version',

  // Maximum number of retries to attempt when http requests to the Node fail
  HTTP_REQUEST_MAX_RETRY: 3,

  // Delay between retry in ms
  HTTP_REQUEST_RETRY_DELAY: 100,

  // Maximum number of retries to get the confirmation of a persistTransaction
  GET_CONFIRMATION_MAX_RETRY: 500,

  // Delay between retry in ms to get the confirmation of a persistTransaction
  GET_CONFIRMATION_RETRY_DELAY: 3000,

  // Delay to wait in ms before trying for the first time to get the confirmation of a persistTransaction
  GET_CONFIRMATION_DEFER_DELAY: 3000,
};

export default config;
