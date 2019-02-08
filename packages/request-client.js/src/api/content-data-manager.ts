import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import DataFormat from '@requestnetwork/data-format';

const CONTENT_DATA_EXTENSION_ID = ExtensionTypes.EXTENSION_ID.CONTENT_DATA;

/**
 * Handles the content data of a request
 *
 * @export
 * @class ContentDataManager
 */
export default class ContentDataManager {
  private extensionManager: ExtensionTypes.ContentData.IContentDataManager;

  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.extensionManager = advancedLogic.extensions.contentData;
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param {*} content content to link to the request
   * @returns {*} extensionsData ready to be added to the request
   * @memberof ContentData
   */
  public createExtensionsDataForCreation(content: any): any {
    if (DataFormat.isKnownFormat(content)) {
      const { valid, errors } = DataFormat.validate(content);

      if (!valid) {
        const errorsToShow = errors.map((e: any) => JSON.stringify(e)).join('\n');
        throw new Error(
          `The content data seem to follow a request format but contains errors: ${errorsToShow}`,
        );
      }
    }

    return this.extensionManager.createCreationAction({ content });
  }

  /**
   * Gets the content from the extensions state
   *
   * @param {RequestLogicTypes.IRequestLogicRequest} request
   * @returns {*}
   * @memberof ContentDataManager
   */
  public getContent(request: RequestLogicTypes.IRequestLogicRequest): any {
    if (request.extensions[CONTENT_DATA_EXTENSION_ID]) {
      return request.extensions[CONTENT_DATA_EXTENSION_ID].values.content;
    }
    return null;
  }
}
