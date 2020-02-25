import DataFormat from '@requestnetwork/data-format';
import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

// Extension ID for this class: content data
const CONTENT_DATA_ID = ExtensionTypes.ID.CONTENT_DATA;

/**
 * Handles the content data of a request
 */
export default class ContentDataExtension {
  // Content data extension
  private extension: ExtensionTypes.ContentData.IContentData;

  /**
   * @param advancedLogic Instance of the advanced logic layer
   */
  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.extension = advancedLogic.extensions.contentData;
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param content Content to link to the request
   * @returns ExtensionsData ready to be added to the request
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

    return this.extension.createCreationAction({ content });
  }

  /**
   * Gets the content from the extensions state
   *
   * @param request The request of which we want the content
   * @returns The content
   */
  public getContent(
    request: RequestLogicTypes.IRequest | RequestLogicTypes.IPendingRequest | null,
  ): any {
    if (request && request.extensions && request.extensions[CONTENT_DATA_ID]) {
      return request.extensions[CONTENT_DATA_ID].values.content;
    }
    return null;
  }
}
