import { supportedRinkebyERC20 } from './rinkeby';
import { supportedMainnetERC20 } from './mainnet';
import { supportedCeloERC20 } from './celo';
import { supportedMaticERC20 } from './matic';
import type { TokenMap } from './types';
import { supportedFantomTokens } from './fantom';
import { supportedBSCTestERC20 } from './bsctest';
import { supportedBSCERC20 } from './bsc';
import { supportedXDAIERC20 } from './xdai';
import { supportedGoerliERC20 } from './goerli';
import { supportedAvalancheERC20 } from './avalanche';

export const supportedNetworks: Record<string, TokenMap> = {
  celo: supportedCeloERC20,
  // FIXME: Rinkeby is deprecated
  rinkeby: supportedRinkebyERC20,
  goerli: supportedGoerliERC20,
  mainnet: supportedMainnetERC20,
  matic: supportedMaticERC20,
  fantom: supportedFantomTokens,
  bsctest: supportedBSCTestERC20,
  bsc: supportedBSCERC20,
  xdai: supportedXDAIERC20,
  avalanche: supportedAvalancheERC20,
};

export type { TokenMap };
