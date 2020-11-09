import { RequestLogicTypes } from '@requestnetwork/types';
import { supportedRinkebyERC20, supportedRinkebyERC20Details } from './rinkeby';
import { supportedCeloERC20, supportedCeloERC20Details } from './celo';

/**
 * ERC20 Symbol details type
 */
export interface ERC20SymbolDetails {
  address: string;
  decimals: number;
  name: string;
}

interface ISupportedNetworksMap {
  [network: string]: Map<
    string,
    {
      network: string;
      type: RequestLogicTypes.CURRENCY;
      value: string;
    }
  >;
}

interface ISupportedNetworksDetails {
  [network: string]: {
    [symbol: string]: ERC20SymbolDetails;
  };
}

export const supportedNetworks: ISupportedNetworksMap = {
  celo: supportedCeloERC20,
  rinkeby: supportedRinkebyERC20,
};

export const supportedNetworksDetails: ISupportedNetworksDetails = {
  celo: supportedCeloERC20Details,
  rinkeby: supportedRinkebyERC20Details,
};
