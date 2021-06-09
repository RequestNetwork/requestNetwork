import { ExtensionTypes } from '@requestnetwork/types';
import AbstractExtension from './abstract-extension';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the content data extension
 */
export default class ContentDataExtension<
  TCreationParameters extends ExtensionTypes.ContentData.ICreationParameters = ExtensionTypes.ContentData.ICreationParameters
> extends AbstractExtension<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID = ExtensionTypes.ID.CONTENT_DATA,
    public currentVersion: string = CURRENT_VERSION,
  ) {
    super(ExtensionTypes.TYPE.CONTENT_DATA, extensionId, currentVersion);
  }

  /**
   * Creates the extensionsData to create the extension content-data
   * Should be called to create the extensionsData of a request
   *
   * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be store in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (!creationParameters.content) {
      throw Error('No content has been given for the extension content-data');
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
  }

  /**
   * Applies a creation
   *
   * @param extensionAction action to apply
   * @param timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!extensionAction.parameters.content) {
      throw Error('No content has been given for the extension content-data');
    }

    const genericCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...genericCreationAction,
      events: [],
      id: this.extensionId,
      type: this.extensionType,
      values: {
        ...genericCreationAction.values,
        content: extensionAction.parameters.content,
      },
      version: this.currentVersion,
    };
  }
}
