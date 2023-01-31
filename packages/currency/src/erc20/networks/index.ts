import { TokenMap } from '../../types';
import { CurrencyTypes } from '@requestnetwork/types';

import { supportedAvalancheERC20 } from './avalanche';
import { supportedBSCERC20 } from './bsc';
import { supportedBSCTestERC20 } from './bsctest';
import { supportedCeloERC20 } from './celo';
import { supportedFantomTokens } from './fantom';
import { supportedGoerliERC20 } from './goerli';
import { supportedMainnetERC20 } from './mainnet';
import { supportedMaticERC20 } from './matic';
import { supportedMoonbeamERC20 } from './moonbeam';
import { supportedOptimismERC20 } from './optimism';
import { supportedRinkebyERC20 } from './rinkeby';
import { supportedXDAIERC20 } from './xdai';

export const supportedNetworks: Partial<Record<CurrencyTypes.NetworkName, TokenMap>> = {
  avalanche: supportedAvalancheERC20,
  bsc: supportedBSCERC20,
  bsctest: supportedBSCTestERC20,
  celo: supportedCeloERC20,
  fantom: supportedFantomTokens,
  goerli: supportedGoerliERC20,
  mainnet: supportedMainnetERC20,
  matic: supportedMaticERC20,
  moonbeam: supportedMoonbeamERC20,
  optimism: supportedOptimismERC20,
  // FIXME: Rinkeby is deprecated
  rinkeby: supportedRinkebyERC20,
  xdai: supportedXDAIERC20,
};
