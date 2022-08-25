import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { AbstractExtension } from '../abstract-extension';

const CURRENT_VERSION = '0.1.0';

/**
 * Core of the declarative payment network
 */
export default class DeclarativePaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnAnyDeclarative.ICreationParameters = ExtensionTypes.PnAnyDeclarative.ICreationParameters,
> extends AbstractExtension<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    public currentVersion: string = CURRENT_VERSION,
  ) {
    super(ExtensionTypes.TYPE.PAYMENT_NETWORK, extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION]:
        this.applyAddPaymentInstruction.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION]:
        this.applyAddRefundInstruction.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT]:
        this.applyDeclareSentPayment.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND]:
        this.applyDeclareSentRefund.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT]:
        this.applyDeclareReceivedPayment.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND]:
        this.applyDeclareReceivedRefund.bind(this),
      [ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE]: this.applyAddDelegate.bind(this),
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
      id: this.extensionId,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
        txHash: parameters.txHash,
        network: parameters.network,
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
      id: this.extensionId,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
        txHash: parameters.txHash,
        network: parameters.network,
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
      id: this.extensionId,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
        txHash: parameters.txHash,
        network: parameters.network,
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
      id: this.extensionId,
      parameters: {
        amount: parameters.amount.toString(),
        note: parameters.note,
        txHash: parameters.txHash,
        network: parameters.network,
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
      id: this.extensionId,
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
      id: this.extensionId,
      parameters: {
        refundInfo: parameters.refundInfo,
      },
    };
  }

  /**
   * Creates the extensionsData to add delegate
   *
   * @param extensions extensions parameters to add delegate
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddDelegateAction(
    parameters: ExtensionTypes.PnAnyDeclarative.IAddDelegateParameters,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
      id: this.extensionId,
      parameters: {
        delegate: parameters.delegate,
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
    extensionAction: ExtensionTypes.IAction<TCreationParameters>,
    timestamp: number,
  ): ExtensionTypes.IState {
    const genericCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...genericCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            paymentInfo: extensionAction.parameters?.paymentInfo,
            refundInfo: extensionAction.parameters?.refundInfo,
            salt: extensionAction.parameters?.salt,
            payeeDelegate: extensionAction.parameters?.payeeDelegate,
            payerDelegate: extensionAction.parameters?.payerDelegate,
          },
          timestamp,
        },
      ],
      values: {
        paymentInfo: extensionAction.parameters?.paymentInfo,
        refundInfo: extensionAction.parameters?.refundInfo,
        salt: extensionAction.parameters?.salt,
        payeeDelegate: extensionAction.parameters?.payeeDelegate,
        payerDelegate: extensionAction.parameters?.payerDelegate,
        receivedPaymentAmount: '0',
        receivedRefundAmount: '0',
        sentPaymentAmount: '0',
        sentRefundAmount: '0',
      },
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
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYER);
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
        txHash: extensionAction.parameters.txHash,
        network: extensionAction.parameters.network,
      },
      timestamp,
      from: actionSigner,
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
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYEE);
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
        txHash: extensionAction.parameters.txHash,
        network: extensionAction.parameters.network,
      },
      timestamp,
      from: actionSigner,
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
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYEE);
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
        txHash: extensionAction.parameters.txHash,
        network: extensionAction.parameters.network,
      },
      timestamp,
      from: actionSigner,
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
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYER);
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
        txHash: extensionAction.parameters.txHash,
        network: extensionAction.parameters.network,
      },
      timestamp,
      from: actionSigner,
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
      throw Error(`The payment instruction already assigned`);
    }
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYEE);

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // assign paymentInfo
    copiedExtensionState.values.paymentInfo = extensionAction.parameters.paymentInfo;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
      parameters: {
        paymentInfo: extensionAction.parameters.paymentInfo,
      },
      timestamp,
      from: actionSigner,
    });

    return copiedExtensionState;
  }

  /** Applies an add of a delegate
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyAddDelegate(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    let delegateStr: string;
    if (Utils.identity.areEqual(actionSigner, requestState.payee)) {
      delegateStr = 'payeeDelegate';
    } else if (Utils.identity.areEqual(actionSigner, requestState.payer)) {
      delegateStr = 'payerDelegate';
    } else {
      throw Error(`The signer must be the payee or the payer`);
    }

    if (extensionState.values[delegateStr]) {
      throw Error(`The ${delegateStr} is already assigned`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // assign payeeDelegate or payerDelegate
    copiedExtensionState.values[delegateStr] = extensionAction.parameters.delegate;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
      parameters: {
        delegate: extensionAction.parameters.delegate,
      },
      timestamp,
      from: actionSigner,
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
      throw Error(`The refund instruction already assigned`);
    }
    this.checkIdentities(extensionState, requestState, actionSigner, RequestLogicTypes.ROLE.PAYER);

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // assign refundInfo
    copiedExtensionState.values.refundInfo = extensionAction.parameters.refundInfo;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
      parameters: {
        refundInfo: extensionAction.parameters.refundInfo,
      },
      timestamp,
      from: actionSigner,
    });

    return copiedExtensionState;
  }

  /** Checks if signer is the right identity from the request and the role expected
   *
   * @param extensionsState previous state of the extensions
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param role The role to check (Payee or Payer)
   *
   * @returns throws in case of error
   */
  protected checkIdentities(
    extensionState: ExtensionTypes.IState,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    role: RequestLogicTypes.ROLE,
  ): void {
    let requestRole;
    let requestRoleStr;
    let requestRoleDelegate;

    if (role === RequestLogicTypes.ROLE.PAYER) {
      requestRole = requestState.payer;
      requestRoleStr = 'payer';
      requestRoleDelegate = extensionState.values.payerDelegate;
    }
    if (role === RequestLogicTypes.ROLE.PAYEE) {
      requestRole = requestState.payee;
      requestRoleStr = 'payee';
      requestRoleDelegate = extensionState.values.payeeDelegate;
    }

    if (!requestRole) {
      throw Error(`The request must have a ${requestRoleStr}`);
    }
    if (
      !Utils.identity.areEqual(actionSigner, requestRole) &&
      !Utils.identity.areEqual(actionSigner, requestRoleDelegate)
    ) {
      throw Error(`The signer must be the ${requestRoleStr} or the ${requestRoleStr}Delegate`);
    }
  }
}
