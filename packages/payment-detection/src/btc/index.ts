import BtcMainnetPaymentNetwork from './mainnet-address-based';
import BtcTestnetPaymentNetwork from './testnet-address-based';

import DefaultBitcoinDetectionProvider from './default-bitcoin-detection-provider';

import BlockchainInfoProvider from './default-providers/blockchain-info';
import BlockcypherComProvider from './default-providers/blockcypher-com';
import BlockStreamInfoProvider from './default-providers/blockstream-info';
import ChainSoProvider from './default-providers/chain-so';

const providers = {
  BlockStreamInfoProvider,
  BlockchainInfoProvider,
  BlockcypherComProvider,
  ChainSoProvider,
};

export {
  DefaultBitcoinDetectionProvider,
  BtcMainnetPaymentNetwork,
  BtcTestnetPaymentNetwork,
  providers as Providers,
};
