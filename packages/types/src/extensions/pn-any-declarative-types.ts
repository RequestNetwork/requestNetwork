import * as Extension from '../extension-types';
import * as RequestLogicTypes from '../request-logic-types';

/** Manager of the extension */
export interface IAnyDeclarative extends Extension.IExtension {
  createDeclareSentPaymentAction: (parameters: ISentParameters) => Extension.IAction;
  createDeclareSentRefundAction: (parameters: ISentParameters) => Extension.IAction;
  createDeclareReceivedPaymentAction: (parameters: IReceivedParameters) => Extension.IAction;
  createDeclareReceivedRefundAction: (parameters: IReceivedParameters) => Extension.IAction;
  createAddPaymentInstructionAction: (
    parameters: IAddPaymentInstructionParameters,
  ) => Extension.IAction;
  createAddRefundInstructionAction: (
    parameters: IAddRefundInstructionParameters,
  ) => Extension.IAction;
  createCreationAction: (parameters?: ICreationParameters) => Extension.IAction;
}

/** Extension values of the extension */
export interface IValues {
  paymentInfo?: any;
  refundInfo?: any;
}

/** Parameters of creation action */
export interface ICreationParameters {
  paymentInfo?: any;
  refundInfo?: any;
}

/** Parameters of declareSentPayment and declareSentRefund action */
export interface ISentParameters {
  amount: RequestLogicTypes.Amount;
  note: any;
}

/** Parameters of declareReceivedPayment and declareReceivedRefund action */
export interface IReceivedParameters {
  amount: RequestLogicTypes.Amount;
  note: any;
}

/** Parameters of addPaymentInstruction action */
export interface IAddPaymentInstructionParameters {
  paymentInfo: any;
}

/** Parameters of addRefundInstruction action */
export interface IAddRefundInstructionParameters {
  refundInfo: any;
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',

  DECLARE_SENT_PAYMENT = 'declareSentPayment',
  DECLARE_RECEIVED_PAYMENT = 'declareReceivedPayment',

  DECLARE_SENT_REFUND = 'declareSentRefund',
  DECLARE_RECEIVED_REFUND = 'declareReceivedRefund',

  ADD_PAYMENT_INSTRUCTION = 'addPaymentInstruction',
  ADD_REFUND_INSTRUCTION = 'addRefundInstruction',
}
