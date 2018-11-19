const bigNumber: any = require('bn.js');
import * as RequestEnum from './enum';

// Interface of the parameters needed to sign
export interface IRequestLogicSignatureParameters {
  // method of the signature
  method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD;
  // value used to sign
  privateKey: string;
}

// Interface of a signature
export interface IRequestLogicSignature {
  // method used to sign
  method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD;
  // the signature itself
  value: string;
}

// Interface of an identity object
export interface IRequestLogicIdentity {
  // type of the identification
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE;
  // the identification itself
  value: string;
}

// Interface of a request logic transaction
export interface IRequestLogicTransaction {
  action: RequestEnum.REQUEST_LOGIC_ACTION;
  version: string;
  parameters?: any;
}

// Interface of a request logic signed transaction
export interface IRequestLogicSignedTransaction {
  transaction: IRequestLogicTransaction;
  signature: IRequestLogicSignature;
}

// Properties of a request in request logic
export interface IRequestLogicRequest {
  version: string;
  // request identifier
  requestId: RequestLogicRequestId;
  // indentity of the request creator (the one who initiates it)
  creator: IRequestLogicIdentity;
  currency: RequestEnum.REQUEST_LOGIC_CURRENCY;
  state: RequestEnum.REQUEST_LOGIC_STATE;
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
export interface IRequestLogicRequestCreateParameters {
  currency: RequestEnum.REQUEST_LOGIC_CURRENCY;
  expectedAmount: RequestLogicAmount;
  payee?: IRequestLogicIdentity;
  payer?: IRequestLogicIdentity;
  extensions?: any[];
}

// Parameters to accept a request
export interface IRequestLogicRequestAcceptParameters {
  requestId: RequestLogicRequestId;
  extensions?: any[];
}

// Parameters to cancel a request
export interface IRequestLogicRequestCancelParameters {
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
  name: RequestEnum.REQUEST_LOGIC_ACTION;
  // the information given in the event
  parameters?: any;
  transactionSigner: IRequestLogicIdentity;
}
