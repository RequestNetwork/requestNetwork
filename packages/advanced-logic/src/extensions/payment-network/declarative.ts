import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AbstractExtension from '../abstract-extension';

const CURRENT_VERSION = '0.1.0';

/**
 * Core of the declarative payment network
 */
export default class DeclarativePaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnAnyDeclarative.ICreationParameters = ExtensionTypes.PnAnyDeclarative.ICreationParameters
> extends AbstractExtension<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    public currentVersion: string = CURRENT_VERSION,
  ) {
    super(ExtensionTypes.TYPE.PAYMENT_NETWORK, extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .ADD_PAYMENT_INSTRUCTION]: this.applyAddPaymentInstruction.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .ADD_REFUND_INSTRUCTION]: this.applyAddRefundInstruction.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .DECLARE_SENT_PAYMENT]: this.applyDeclareSentPayment.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .DECLARE_SENT_REFUND]: this.applyDeclareSentRefund.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .DECLARE_RECEIVED_PAYMENT]: this.applyDeclareReceivedPayment.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION
        .DECLARE_RECEIVED_REFUND]: this.applyDeclareReceivedRefund.bind(this),
    };
  }

  /**
   * Creates the extensionsData to add a sent payment declaration
   *
   * @param parameters parameters to create sent payment declaration
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createDeclareSentPaymentAction(
    parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
      },
    };
  }

  /**
   * Creates the extensionsData to add a sent refund declaration
   *
   * @param parameters parameters to create sent refund declaration
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createDeclareSentRefundAction(
    parameters: ExtensionTypes.PnAnyDeclarative.ISentParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
      },
    };
  }

  /**
   * Creates the extensionsData to add a received payment declaration
   *
   * @param parameters parameters to create received payment declaration
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createDeclareReceivedPaymentAction(
    parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
      },
    };
  }

  /**
   * Creates the extensionsData to add a received refund declaration
   *
   * @param parameters parameters to create received refund declaration
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createDeclareReceivedRefundAction(
    parameters: ExtensionTypes.PnAnyDeclarative.IReceivedParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
      },
    };
  }

  /**
   * Creates the extensionsData to add payment instruction
   *
   * @param extensions extensions parameters to add payment instruction
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddPaymentInstructionAction(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddPaymentInstructionParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        paymentInfo: parameters.paymentInfo,
      },
    };
  }

  /**
   * Creates the extensionsData to add refund instruction
   *
   * @param extensions extensions parameters to add refund instruction
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddRefundInstructionAction(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddRefundInstructionParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
      parameters: {
        refundInfo: parameters.refundInfo,
      },
    };
  }

  /** Applies a creation
   *
   * @param extensionAction action to apply
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    return {
      events: [
        {
          name: 'create',
          parameters: {
            paymentInfo: extensionAction.parameters.paymentInfo,
            refundInfo: extensionAction.parameters.refundInfo,
            thirdparty: extensionAction.parameters.thirdparty,
          },
          timestamp,
        },
      ],
      id: extensionAction.id,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentInfo: extensionAction.parameters.paymentInfo,
        receivedPaymentAmount: '0',
        receivedRefundAmount: '0',
        refundInfo: extensionAction.parameters.refundInfo,
        sentPaymentAmount: '0',
        sentRefundAmount: '0',
        thirdparty: extensionAction.parameters.thirdparty,
      },
      version: CURRENT_VERSION,
    };
  }

  /** Applies a declare sent payment
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyDeclareSentPayment(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!requestState.payer && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payer or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payer) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payer or the thirdparty`);
    }
    if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
      throw Error(`The amount is not a valid amount`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment sentPaymentAmount
    copiedExtensionState.values.sentPaymentAmount = Utils.amount.add(
      copiedExtensionState.values.sentPaymentAmount,
      extensionAction.parameters.amount,
    );

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
      parameters: {
        amount: extensionAction.parameters.amount,
        note: extensionAction.parameters.note,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  /** Applies a declare sent refund
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyDeclareSentRefund(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!requestState.payee && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payee or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payee) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payee or the thirdparty`);
    }
    if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
      throw Error(`The amount is not a valid amount`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment sentRefundAmount
    copiedExtensionState.values.sentRefundAmount = Utils.amount.add(
      copiedExtensionState.values.sentRefundAmount,
      extensionAction.parameters.amount,
    );

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
      parameters: {
        amount: extensionAction.parameters.amount,
        note: extensionAction.parameters.note,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  /** Applies a declare received payment
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyDeclareReceivedPayment(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!requestState.payee && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payee or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payee) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payee or the thirdparty`);
    }
    if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
      throw Error(`The amount is not a valid amount`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment receivedPaymentAmount
    copiedExtensionState.values.receivedPaymentAmount = Utils.amount.add(
      copiedExtensionState.values.receivedPaymentAmount,
      extensionAction.parameters.amount,
    );

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
      parameters: {
        amount: extensionAction.parameters.amount,
        note: extensionAction.parameters.note,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  /** Applies a declare received refund
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyDeclareReceivedRefund(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!requestState.payer && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payer or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payer) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payer or the thirdparty`);
    }
    if (!Utils.amount.isValid(extensionAction.parameters.amount)) {
      throw Error(`The amount is not a valid amount`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment receivedRefundAmount
    copiedExtensionState.values.receivedRefundAmount = Utils.amount.add(
      copiedExtensionState.values.receivedRefundAmount,
      extensionAction.parameters.amount,
    );

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
      parameters: {
        amount: extensionAction.parameters.amount,
        note: extensionAction.parameters.note,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  /** Applies an add of payment instruction
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyAddPaymentInstruction(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (extensionState.values.paymentInfo) {
      throw Error(`The payment instruction already given`);
    }
    if (!requestState.payee && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payee or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payee) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payee or the thirdparty`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment paymentInfo
    copiedExtensionState.values.paymentInfo = extensionAction.parameters.paymentInfo;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
      parameters: {
        paymentInfo: extensionAction.parameters.paymentInfo,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  /** Applies an add of refund instruction
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyAddRefundInstruction(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (extensionState.values.refundInfo) {
      throw Error(`The refund instruction already given`);
    }
    if (!requestState.payer && !extensionState.values.thirdparty) {
      throw Error(`The request must have a payer or a thirdparty`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestState.payer) &&
      !Utils.identity.areEqual(actionSigner, extensionState.values.thirdparty)
    ) {
      throw Error(`The signer must be the payer or the thirdparty`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // increment refundInfo
    copiedExtensionState.values.refundInfo = extensionAction.parameters.refundInfo;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
      parameters: {
        refundInfo: extensionAction.parameters.refundInfo,
      },
      timestamp,
    });

    return copiedExtensionState;
  }
}
