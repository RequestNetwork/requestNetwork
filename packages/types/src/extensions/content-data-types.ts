import * as Extension from '../extension-types';
import { EnumToType } from '../shared';

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

export const ACTION = {
  CREATE: 'create',
} as const;

/** Actions possible */
export type ACTION = EnumToType<typeof ACTION>;
