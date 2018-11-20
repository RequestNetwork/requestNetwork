const bigNumber: any = require('bn.js');

export interface IRequestLogic {
  createRequest: (
    requestParameters: IRequestLogicCreateParameters,
    signatureParams: IRequestLogicSignatureParameters,
    indexes: string[],
  ) => string; // TODO modify it
  acceptRequest: (
    requestParameters: IRequestLogicAcceptParameters,
    signatureParams: IRequestLogicSignatureParameters,
  ) => string; // TODO modify it
  cancelRequest: (
    requestParameters: IRequestLogicCancelParameters,
    signatureParams: IRequestLogicSignatureParameters,
  ) => string; // TODO modify it
  increaseExpectecAmountRequest: (
    requestParameters: IRequestLogicIncreaseExpectedAmountParameters,
    signatureParams: IRequestLogicSignatureParameters,
  ) => string; // TODO modify it
  reduceExpectecAmountRequest: (
    requestParameters: IRequestLogicReduceExpectedAmountParameters,
    signatureParams: IRequestLogicSignatureParameters,
  ) => string; // TODO modify it
  getRequestById: (
    requestId: RequestLogicRequestId,
  ) => IRequestLogicRequest | undefined;
}

// Interface of the parameters needed to sign
export interface IRequestLogicSignatureParameters {
  // method of the signature
  method: REQUEST_LOGIC_SIGNATURE_METHOD;
  // value used to sign
  privateKey: string;
}

// Interface of a signature
export interface IRequestLogicSignature {
  // method used to sign
  method: REQUEST_LOGIC_SIGNATURE_METHOD;
  // the signature itself
  value: string;
}

// Interface of an identity object
export interface IRequestLogicIdentity {
  // type of the identification
  type: REQUEST_LOGIC_IDENTITY_TYPE;
  // the identification itself
  value: string;
}

// Interface of a request logic transaction data
export interface IRequestLogicTransactionData {
  action: REQUEST_LOGIC_ACTION;
  version: string;
  parameters?: any;
}

// Interface of a request logic transaction
export interface IRequestLogicTransaction {
  data: IRequestLogicTransactionData;
  signature: IRequestLogicSignature;
}

// Properties of a request in request logic
export interface IRequestLogicRequest {
  version: string;
  // request identifier
  requestId: RequestLogicRequestId;
  // indentity of the request creator (the one who initiates it)
  creator: IRequestLogicIdentity;
  currency: REQUEST_LOGIC_CURRENCY;
  state: REQUEST_LOGIC_STATE;
  expectedAmount: RequestLogicAmount;
  payee?: IRequestLogicIdentity;
  payer?: IRequestLogicIdentity;
  // Array of extensions data linked to the request
  extensions?: any[];
  events: IRequestLogicEvent[];
}

// Type of amount used in request logic
export type RequestLogicAmount = number | string | typeof bigNumber;

// TYpe of the requestId propertie
export type RequestLogicRequestId = string;

// Type of the configuration for the versionning
export interface IRequestLogicVersionSupportConfig {
  // current version of the specification supported by this implementation
  // will be use to check if the implemenation can handle transaction with different specs version
  current: string;
  // list of versions not supported in any case
  exceptions: string[];
}

// Parameters to create a request
export interface IRequestLogicCreateParameters {
  currency: REQUEST_LOGIC_CURRENCY;
  expectedAmount: RequestLogicAmount;
  payee?: IRequestLogicIdentity;
  payer?: IRequestLogicIdentity;
  extensions?: any[];
}

// Parameters to accept a request
export interface IRequestLogicAcceptParameters {
  requestId: RequestLogicRequestId;
  extensions?: any[];
}

// Parameters to cancel a request
export interface IRequestLogicCancelParameters {
  requestId: RequestLogicRequestId;
  extensions?: any[];
}

// Parameters to increase amount of a request
export interface IRequestLogicIncreaseExpectedAmountParameters {
  deltaAmount: RequestLogicAmount;
  requestId: RequestLogicRequestId;
  extensions?: any[];
}

// Parameters to reduce amount of a request
export interface IRequestLogicReduceExpectedAmountParameters {
  deltaAmount: RequestLogicAmount;
  requestId: RequestLogicRequestId;
  extensions?: any[];
}

// Interface of an event
export interface IRequestLogicEvent {
  // Name of this event is actually an action
  name: REQUEST_LOGIC_ACTION;
  // the information given in the event
  parameters?: any;
  transactionSigner: IRequestLogicIdentity;
}

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
