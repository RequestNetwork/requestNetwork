// Interface of an identity object
export interface IIdentity {
  // type of the identification
  type: REQUEST_IDENTITY_TYPE;
  // the identification itself
  value: string;
}

// Enum of identity type supported by this library
export enum REQUEST_IDENTITY_TYPE {
  ETHEREUM_ADDRESS = 'ethereumAddress',
}
