/** Identity */
export interface IIdentity {
  // type of the identification
  type: REQUEST_IDENTITY_TYPE;
  // the identification itself
  value: string;
}

/** Supported identity types */
export enum REQUEST_IDENTITY_TYPE {
  ETHEREUM_ADDRESS = 'ethereumAddress',
}
