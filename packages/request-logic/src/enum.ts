// Enum of action possible in a transaction
export enum REQUEST_LOGIC_ACTION {
  CREATE = 'create',
  BROADCAST = 'broadcastSignedRequest',
  ACCEPT = 'accept',
  CANCEL = 'cancel',
  REDUCE_EXPECTED_AMOUNT = 'reduceExpectedAmount',
  INCREASE_EXPECTED_AMOUNT = 'increaseExpectedAmount',
}

// Enum of currencies supported by this library
export enum REQUEST_LOGIC_CURRENCY {
  ETH = 'ETH',
  BTC = 'BTC',
}

// Enum of the state possible for a request
export enum REQUEST_LOGIC_STATE {
  CREATED = 'created',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
}

// Enum of identity type supported by this library
export enum REQUEST_LOGIC_IDENTITY_TYPE {
  ETHEREUM_ADDRESS = 'ethereumAddress',
}

// Enum of signature method supported by this library
export enum REQUEST_LOGIC_SIGNATURE_METHOD {
  ECDSA = 'ecdsa',
}

// Enum of possible identity roles
export enum REQUEST_LOGIC_ROLE {
  PAYEE = 'payee',
  PAYER = 'payer',
  THIRD_PARTY = 'thirdparty',
}
