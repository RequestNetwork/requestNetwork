import * as PnAnyToAnyConversion from './pn-any-to-any-conversion-types';

/** Any to ETH reference-based payment network extension interface */
export type IAnyToEth = PnAnyToAnyConversion.IConversionReferenceBased<ICreationParameters>;

/** Parameters for the creation action */
export type ICreationParameters = Omit<PnAnyToAnyConversion.ICreationParameters, 'network'> & {
  network: string;
};
