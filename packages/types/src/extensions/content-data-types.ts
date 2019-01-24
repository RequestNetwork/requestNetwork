import * as Extension from '../extension-types';

/** Manager of the extension */
export interface IContentDataManager extends Extension.IExtension {
  createCreationAction: (
    creationParameters: IContentDataCreationParameters,
  ) => Extension.IExtensionAction;
}

/** Extension values of content data */
export interface IExtensionContentDataValues {
  content: any;
}

/** Parameters of creation action */
export interface IContentDataCreationParameters {
  content: any;
}

/** Actions possible */
export enum CONTENT_DATA_ACTION {
  CREATE = 'create',
}
