import * as PnAnyToAnyConversion from './pn-any-to-any-conversion-types';

/** Any to ERC20 reference-based payment network extension interface */
export type IAnyToERC20 = PnAnyToAnyConversion.IConversionReferenceBased<ICreationParameters>;

/** Parameters for the creation action */
export interface ICreationParameters extends PnAnyToAnyConversion.ICreationParameters {
  // FIXME: should be mandatory according to AnyToErc20ProxyPaymentNetwork createCreationAction() logic
  acceptedTokens?: string[];
}
