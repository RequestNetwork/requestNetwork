/**
 * Error class used to differentiate error on which we want to retry or not to read ipfs hashes
 * We should retry to read an ipfs hash if the error come from a connection issue
 */
// tslint:disable-next-line:max-classes-per-file
export default class IpfsConnectionError extends Error {}
