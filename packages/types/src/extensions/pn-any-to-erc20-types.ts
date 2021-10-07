import * as Extension from '../extension-types';
import * as PnAnyToAnyConversion from './pn-any-to-any-conversion-types';

/** Any to ERC20 reference-based payment network extension interface */
export interface IAnyToERC20 extends PnAnyToAnyConversion.IConversionReferenceBased {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
}

/** Parameters for the creation action */
export interface ICreationParameters extends PnAnyToAnyConversion.ICreationParameters {
  acceptedTokens?: string[];
}
