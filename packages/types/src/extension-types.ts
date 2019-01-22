import * as ContentData from './extensions/content-data-types';

export { ContentData };

/** Extensions state in advanced logic */
export interface IExtensionState {
  type: EXTENSION_TYPE;
  id: EXTENSION_ID;
  version: string;
  events: IExtensionEvent[];
  values: any;
}

/** Action type */
export type IExtensionAction = IExtensionCreationAction | IExtensionUpdateAction;

/** Creation action object */
export interface IExtensionCreationAction {
  type: EXTENSION_TYPE;
  id: EXTENSION_ID;
  version: string;
  parameters?: any;
}

/** Update action object */
export interface IExtensionUpdateAction {
  action: string;
  id: EXTENSION_ID;
  parameters?: any;
}

/** extension event object */
export interface IExtensionEvent {
  name: string;
  parameters: any;
}

/** Identification of extensions handled by this implementation */
export enum EXTENSION_ID {
  CONTENT_DATA = 'content-data',
}

/** Type of extensions */
export enum EXTENSION_TYPE {
  CONTENT_DATA = 'content-data',
}
