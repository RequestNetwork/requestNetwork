/**
 * Collection of general purpose utility function
 */

export { addAmount, isValidAmount, reduceAmount } from './amount.js';

export { minBigNumber, maxBigNumber } from './bignumber.js';

export { cachedThrottle } from './cached-throttle.js';

export {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
  ecDecrypt,
  ecEncrypt,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  ecRecover,
  ecSign,
  generate32BufferKey,
  generate8randomBytes,
  keccak256Hash,
  last20bytesOfNormalizedKeccak256Hash,
  normalize,
  normalizeKeccak256Hash,
} from './crypto.js';

export { decrypt, encrypt, getIdentityFromEncryptionParams } from './encryption.js';

export { normalizeGasFees } from './normalize-gas-fees.js';

export {
  areEqualIdentities,
  identityHasError,
  normalizeIdentityValue,
  supportedIdentities,
} from './identity.js';

export {
  setProviderFactory,
  initPaymentDetectionApiKeys,
  isEip1559Supported,
  getDefaultProvider,
  getCeloProvider,
  networkRpcs,
} from './providers.js';

export { retry } from './retry.js';

export { getIdentityFromSignatureParams, recoverSigner, sign } from './signature.js';

export { SimpleLogger } from './simple-logger.js';

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
} from './utils.js';
