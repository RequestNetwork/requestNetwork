import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AddressBasedPaymentNetwork from './address-based';

// Regex for "at least 16 hexadecimal numbers". Used to validate the salt
const eightHexRegex = /[0-9a-f]{16,}/;

/**
 * Core of the reference based payment networks
 * This module is called by the reference based payment networks to avoid code redundancy
 */
export default abstract class ReferenceBasedPaymentNetwork<
    TCreationParameters extends ExtensionTypes.PnReferenceBased.ICreationParameters = ExtensionTypes.PnReferenceBased.ICreationParameters
  >
  extends AddressBasedPaymentNetwork<TCreationParameters>
  implements ExtensionTypes.PnReferenceBased.IReferenceBased<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID,
    public currentVersion: string,
    public supportedNetworks: string[],
    public supportedCurrencyType: string,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnReferenceBased.ACTION.DECLARE_PAYMENT]: this.applyDeclarePayment.bind(this),
    };
  }

  /**
   * Creates the extensionsData to create the payment detection extension
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (!creationParameters.salt) {
      throw Error('salt should not be empty');
    }

    if (!eightHexRegex.test(creationParameters.salt)) {
      throw Error(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
      );
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
  }

  /**
   * Creates the extensionsData to declare payment
   *
   * @param declarePaymentParameters extensions parameters to declare
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createDeclarePaymentAction(
    declarePaymentParameters: ExtensionTypes.PnReferenceBased.IDeclarePaymentParameters,
  ): ExtensionTypes.IAction {
    if (!declarePaymentParameters.amount) {
      throw Error('amount is required');
    }

    if (!Utils.amount.isValid(declarePaymentParameters.amount)) {
      throw Error('amount is not valid amount');
    }

    return {
      id: this.extensionId,
      action: ExtensionTypes.PnReferenceBased.ACTION.DECLARE_PAYMENT,
      parameters: declarePaymentParameters,
    };
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp ?
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!extensionAction.parameters.salt) {
      throw Error('salt should not be empty');
    }

    if (!eightHexRegex.test(extensionAction.parameters.salt)) {
      throw Error(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
      );
    }

    const basicCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...basicCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
          },
          timestamp,
        },
      ],
      id: this.extensionId,
      type: this.extensionType,
      values: {
        ...basicCreationAction.values,
        salt: extensionAction.parameters.salt,
      },
      version: this.currentVersion,
    };
  }

  /**
   * Applies declare payment
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the updated extension
   */
  protected applyDeclarePayment(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!requestState.payee) {
      throw Error(`The request must have a payee`);
    }
    if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
      throw Error(`The signer must be the payee`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // update the amount and txHash
    copiedExtensionState.values.amount = extensionAction.parameters.amount;
    copiedExtensionState.values.txHash = extensionAction.parameters.txHash;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnReferenceBased.ACTION.DECLARE_PAYMENT,
      parameters: {
        amount: extensionAction.parameters.amount,
        txHash: extensionAction.parameters.txHash,
      },
      timestamp,
    });

    return copiedExtensionState;
  }
}
