/**
 * Collection of general purpose utility function
 */

export { addAmount, isValidAmount, reduceAmount } from './amount';

export { minBigNumber, maxBigNumber } from './bignumber';

export { cachedThrottle } from './cached-throttle';

export {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
  ecDecrypt,
  ecEncrypt,
  getAddressFromEcPrivateKey,
  getAddressFromEcPublicKey,
  getAddressFromEdPrivateKey,
  getAddressFromEdPublicKey,
  getPublicKeyFromEdPrivateKey,
  ecRecover,
  ecSign,
  edSign,
  generate32BufferKey,
  generate8randomBytes,
  keccak256Hash,
  last20bytesOfNormalizedKeccak256Hash,
  normalize,
  normalizeKeccak256Hash,
  normalizePoseidonHash,
  poseidonHash,
  merkleTree8root
} from './crypto';

export { decrypt, encrypt, getIdentityFromEncryptionParams } from './encryption';

export { estimateGasFees } from './estimate-gas-fees';

export {
  areEqualIdentities,
  identityHasError,
  normalizeIdentityValue,
  supportedIdentities,
} from './identity';

export {
  setProviderFactory,
  initPaymentDetectionApiKeys,
  isEip1559Supported,
  getDefaultProvider,
  getCeloProvider,
  networkRpcs,
} from './providers';

export { retry } from './retry';

export { getIdentityFromSignatureParams, recoverSigner, sign } from './signature';

export { SimpleLogger } from './simple-logger';

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
