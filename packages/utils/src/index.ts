/**
 * Collection of general purpose utility function
 */

export {
  add,
  isValid,
  reduce,
} from './amount';

export {
  min,
  max,
} from './bignumber';

export {
  cachedThrottle,
} from './cached-throttle';

export {
  CryptoWrapper,
  EcUtils,
  generate32BufferKey,
  generate8randomBytes,
  keccak256Hash,
  last20bytesOfNormalizedKeccak256Hash,
  normalize,
  normalizeKeccak256Hash,
} from './crypto';

export {
  decrypt,
  encrypt,
  getIdentityFromEncryptionParams,
} from './encryption';

export { estimateGasFees } from './estimate-gas-fees';

export {
  areEqual,
  hasError,
  normalizeIdentityValue,
  supportedIdentities,
} from './identity';

export {
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getCeloProvider,
  networkRpcs,
} from './providers';

export { retry } from './retry';

export {
  getIdentityFromSignatureParams,
  recover,
  sign,
} from './signature';

export {
  SimpleLogger,
} from './simple-logger';

export {
  deepCopy,
  deepSort,
  flatten2DimensionsArray,
  getCurrentTimestampInSecond,
  isString,
  timeoutPromise,
  unique,
  uniqueByProperty,
  notNull,
} from './utils';


