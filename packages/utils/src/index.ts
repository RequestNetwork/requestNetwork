import crypto from './crypto';
import identity from './identity';
import signature from './signature';
import utils from './utils';

/**
 * Collection of general purpose utility function
 */
export default {
  crypto,
  deepCopy: utils.deepCopy,
  deepSort: utils.deepSort,
  flatten2DimensionsArray: utils.flatten2DimensionsArray,
  getCurrentTimestampInSecond: utils.getCurrentTimestampInSecond,
  identity,
  isString: utils.isString,
  signature,
  unique: utils.unique,
};
