import crypto from './crypto';
import utils from './utils';

/**
 * Collection of general purpose utility function
 */
export default {
  crypto,
  deepCopy: utils.deepCopy,
  deepSort: utils.deepSort,
  isString: utils.isString,
};
