import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Erc20ProxyPaymentNetwork from './proxy-contract';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc20FeeProxyPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnFeeReferenceBased.ICreationParameters = ExtensionTypes.PnFeeReferenceBased.ICreationParameters
> extends Erc20ProxyPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = [
      'mainnet',
      'rinkeby',
      'private',
      'matic',
      'mumbai',
      'celo',
      'alfajores',
      'fuse',
    ],
    public supportedCurrencyType: string = RequestLogicTypes.CURRENCY.ERC20,
  ) {
    super(extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE]: this.applyAddFee.bind(this),
    };
  }

  /**
   * Creates the extensionsData to create the extension ERC20 fee proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (creationParameters.feeAddress && !this.isValidAddress(creationParameters.feeAddress)) {
      throw Error('feeAddress is not a valid address');
    }

    if (creationParameters.feeAmount && !Utils.amount.isValid(creationParameters.feeAmount)) {
      throw Error('feeAmount is not a valid amount');
    }

    if (!creationParameters.feeAmount && creationParameters.feeAddress) {
      throw Error('feeAmount requires feeAddress');
    }
    if (creationParameters.feeAmount && !creationParameters.feeAddress) {
      throw Error('feeAddress requires feeAmount');
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
  }

  /**
   * Creates the extensionsData to add a fee address
   *
   * @param addFeeParameters extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddFeeAction(
    addFeeParameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
  ): ExtensionTypes.IAction {
    if (addFeeParameters.feeAddress && !this.isValidAddress(addFeeParameters.feeAddress)) {
      throw Error('feeAddress is not a valid address');
    }

    if (addFeeParameters.feeAmount && !Utils.amount.isValid(addFeeParameters.feeAmount)) {
      throw Error('feeAmount is not a valid amount');
    }

    if (addFeeParameters.feeAddress && !addFeeParameters.feeAmount) {
      throw Error('feeAddress requires feeAmount');
    }
    if (addFeeParameters.feeAmount && !addFeeParameters.feeAddress) {
      throw Error('feeAmount requires feeAddress');
    }

    return {
      action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
      id: this.extensionId,
      parameters: addFeeParameters,
    };
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp action timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.feeAddress &&
      !this.isValidAddress(extensionAction.parameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid address');
    }
    if (
      extensionAction.parameters.feeAmount &&
      !Utils.amount.isValid(extensionAction.parameters.feeAmount)
    ) {
      throw Error('feeAmount is not a valid amount');
    }

    const proxyPNCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...proxyPNCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            feeAddress: extensionAction.parameters.feeAddress,
            feeAmount: extensionAction.parameters.feeAmount,
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
          },
          timestamp,
        },
      ],
      values: {
        ...proxyPNCreationAction.values,
        feeAddress: extensionAction.parameters.feeAddress,
        feeAmount: extensionAction.parameters.feeAmount,
      },
    };
  }

  /**
   * Applies an add fee address and amount extension action
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp action timestamp
   *
   * @returns state of the extension updated
   */
  protected applyAddFee(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.feeAddress &&
      !this.isValidAddress(extensionAction.parameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid address');
    }
    if (extensionState.values.feeAddress) {
      throw Error(`Fee address already given`);
    }
    if (
      extensionAction.parameters.feeAmount &&
      !Utils.amount.isValid(extensionAction.parameters.feeAmount)
    ) {
      throw Error('feeAmount is not a valid amount');
    }
    if (extensionState.values.feeAmount) {
      throw Error(`Fee amount already given`);
    }
    if (!requestState.payee) {
      throw Error(`The request must have a payee`);
    }
    if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
      throw Error(`The signer must be the payee`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // update fee address and amount
    copiedExtensionState.values.feeAddress = extensionAction.parameters.feeAddress;
    copiedExtensionState.values.feeAmount = extensionAction.parameters.feeAmount;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
      parameters: {
        feeAddress: extensionAction.parameters.feeAddress,
        feeAmount: extensionAction.parameters.feeAmount,
      },
      timestamp,
    });

    return copiedExtensionState;
  }
}
