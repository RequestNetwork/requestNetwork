import { supportedRinkebyERC20 } from './rinkeby';
import { supportedMainnetERC20 } from './mainnet';
import { supportedCeloERC20 } from './celo';
import { supportedMaticERC20 } from './matic';
import type { TokenMap } from './types';

export const supportedNetworks: Record<string, TokenMap> = {
  celo: supportedCeloERC20,
  rinkeby: supportedRinkebyERC20,
  mainnet: supportedMainnetERC20,
  matic: supportedMaticERC20,
};

export type { TokenMap };
