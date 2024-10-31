import * as PnAnyToAnyConversion from './pn-any-to-any-conversion-types';
import { HinkalSupportedNetworks } from '../currency-types';

/** Any to Hinkal Wallet reference-based payment network extension interface */
export type IAnyToHinkalWalletErc20 =
  PnAnyToAnyConversion.IConversionReferenceBased<ICreationParameters>;

/** Parameters for the creation action */
export interface ICreationParameters extends PnAnyToAnyConversion.ICreationParameters {
  network: HinkalSupportedNetworks;
  acceptedTokens: string[];
}
