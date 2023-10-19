import { TokenMap } from '../../types.js';
import { CurrencyTypes } from '@requestnetwork/types';

import { supportedAvalancheERC20 } from './avalanche.js';
import { supportedBSCERC20 } from './bsc.js';
import { supportedBSCTestERC20 } from './bsctest.js';
import { supportedCeloERC20 } from './celo.js';
import { supportedFantomERC20 } from './fantom.js';
import { supportedGoerliERC20 } from './goerli.js';
import { supportedMainnetERC20 } from './mainnet.js';
import { supportedMaticERC20 } from './matic.js';
import { supportedMoonbeamERC20 } from './moonbeam.js';
import { supportedOptimismERC20 } from './optimism.js';
import { supportedRinkebyERC20 } from './rinkeby.js';
import { supportedXDAIERC20 } from './xdai.js';

export const supportedNetworks: Partial<Record<CurrencyTypes.EvmChainName, TokenMap>> = {
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
};
