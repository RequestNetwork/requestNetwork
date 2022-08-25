import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Abstract class to create extension
 */
export abstract class AbstractExtension<TCreationParameters> {
  protected actions: ExtensionTypes.SupportedActions;

  public constructor(
    public extensionType: ExtensionTypes.TYPE,
    public extensionId: ExtensionTypes.ID,
    public currentVersion: string,
  ) {
    this.actions = {};
  }

  /**
   * Creates the extensionsData to create the extension
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

    const copiedExtensionState: RequestLogicTypes.IExtensionStates =
      Utils.deepCopy(extensionsState);

    if (extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE) {
      if (requestState.extensions[extensionAction.id]) {
        throw Error(`This extension has already been created`);
      }

      copiedExtensionState[extensionAction.id] = this.applyCreation(extensionAction, timestamp);

      return copiedExtensionState;
    }

    // if the action is not "create", the state must have been created before
    if (!extensionsState[extensionAction.id]) {
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
   * Applies an extension creation action
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
    if (!extensionAction.version) {
      throw Error('version is required at creation');
    }

    return {
      events: [],
      id: extensionAction.id,
      type: this.extensionType,
      values: {},
      version: extensionAction.version,
    };
  }

  /**
   * Validate the extension action regarding the request
   * It is called at the beginning of every applyActionToExtension()
   * It must throw in case of error
   *
   * @param request
   * @param extensionAction action to apply
   */
  protected validate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: RequestLogicTypes.IRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extensionAction: ExtensionTypes.IAction,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}
}
