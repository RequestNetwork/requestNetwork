/** Hash */
export interface IHash {
  // type of the hash
  type: TYPE;
  // the hash itself
  value: string;
}

/** Supported hash types */
export enum TYPE {
  KECCAK256 = 'keccak256',
}
