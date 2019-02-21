import * as Extension from '../extension-types';

/** Manager of the extension */
export interface IContentData extends Extension.IExtension {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
}

/** Extension values of content data */
export interface IValues {
  content: any;
}

/** Parameters of creation action */
export interface ICreationParameters {
  content: any;
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
}
