import { CurrencyTypes } from '@requestnetwork/types';

import { supportedAvalancheERC20 } from './avalanche';
import { supportedBSCERC20 } from './bsc';
import { supportedBSCTestERC20 } from './bsctest';
import { supportedCeloERC20 } from './celo';
import { supportedFantomERC20 } from './fantom';
import { supportedGoerliERC20 } from './goerli';
import { supportedMainnetERC20 } from './mainnet';
import { supportedMaticERC20 } from './matic';
import { supportedMoonbeamERC20 } from './moonbeam';
import { supportedOptimismERC20 } from './optimism';
import { supportedRinkebyERC20 } from './rinkeby';
import { supportedXDAIERC20 } from './xdai';
import { supportedSepoliaERC20 } from './sepolia';

export const supportedNetworks: Partial<
  Record<CurrencyTypes.EvmChainName, CurrencyTypes.TokenMap>
> = {
  celo: supportedCeloERC20,
  // FIXME: Rinkeby is deprecated
  rinkeby: supportedRinkebyERC20,
  goerli: supportedGoerliERC20,
  mainnet: supportedMainnetERC20,
  matic: supportedMaticERC20,
  fantom: supportedFantomERC20,
  bsctest: supportedBSCTestERC20,
  bsc: supportedBSCERC20,
  xdai: supportedXDAIERC20,
  avalanche: supportedAvalancheERC20,
  optimism: supportedOptimismERC20,
  moonbeam: supportedMoonbeamERC20,
  sepolia: supportedSepoliaERC20,
};
