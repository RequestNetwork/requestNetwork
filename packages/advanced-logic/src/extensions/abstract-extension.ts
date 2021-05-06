import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Implementation of the payment network to pay in ERC20 based on a reference provided to a proxy contract.
 * With this extension, one request can have two Ethereum addresses (one for payment and one for refund) and a specific value to give as input data
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
export default abstract class AbstractExtension<TCreationParameters> {
  public actions: { [actionId: string]: ExtensionTypes.ApplyAction };

  public constructor(
    public extensionType: ExtensionTypes.TYPE,
    public extensionId: ExtensionTypes.ID,
    public currentVersion: string,
  ) {
    this.actions = {};
  }

  /**
   * Creates the extensionsData to create the extension ERC20 proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    return {
      action: 'create',
      id: this.extensionId,
      parameters: creationParameters,
      version: this.currentVersion,
    };
  }

  /**
   * Applies the extension action to the request
   * Is called to interpret the extensions data when applying the transaction
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the request updated
   */
  public applyActionToExtension(
    extensionsState: RequestLogicTypes.IExtensionStates,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): RequestLogicTypes.IExtensionStates {
    this.validate(requestState, extensionAction);

    const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(
      extensionsState,
    );

    if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE) {
      if (requestState.extensions[extensionAction.id]) {
        throw Error(`This extension has already been created`);
      }

      copiedExtensionState[extensionAction.id] = this.applyCreation(extensionAction, timestamp);

      return copiedExtensionState;
    }

    // if the action is not "create", the state must have been created before
    if (!requestState.extensions[extensionAction.id]) {
      throw Error(`The extension should be created before receiving any other action`);
    }

    const actionToApply: ExtensionTypes.ApplyAction = this.actions[extensionAction.action];

    if (!actionToApply) {
      throw Error(`Unknown action: ${extensionAction.action}`);
    }

    copiedExtensionState[extensionAction.id] = actionToApply(
      copiedExtensionState[extensionAction.id],
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );

    return copiedExtensionState;
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param _timestamp action timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _timestamp: number,
  ): ExtensionTypes.IState {
    return {
      events: [],
      id: extensionAction.id,
      type: this.extensionType,
      values: {},
      version: this.currentVersion,
    };
  }

  protected abstract validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void;
}
