/** Identity */
export interface IIdentity {
  // type of the identification
  type: TYPE;
  // the identification itself
  value: string;
}

/** Supported identity types */
export enum TYPE {
  ETHEREUM_ADDRESS = 'ethereumAddress',
}
