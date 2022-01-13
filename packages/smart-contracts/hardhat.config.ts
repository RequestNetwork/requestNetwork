import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { config } from 'dotenv';
import deployAllContracts from './scripts/5_deploy-all'
import { deployAllPaymentContracts } from './scripts/deploy-payments';
import { preparePayments } from './scripts/prepare-payments';

import { HardhatRuntimeEnvironment } from 'hardhat/types';

config();

const accounts = process.env.DEPLOYMENT_PRIVATE_KEY
  ? [process.env.DEPLOYMENT_PRIVATE_KEY]
  : process.env.ADMIN_PRIVATE_KEY
  ? [process.env.ADMIN_PRIVATE_KEY]
  : undefined;

if (accounts && process.env.ADMIN_PRIVATE_KEY) {
  accounts.push(process.env.ADMIN_PRIVATE_KEY);
}

export default {
  solidity: '0.8.4',
  paths: {
    sources: 'src/contracts',
    tests: 'test/contracts',
    artifacts: 'build',
  },
  networks: {
    private: {
      url: 'http://127.0.0.1:8545',
      accounts: undefined,
    },
    mainnet: {
      url: process.env.WEB3_PROVIDER_URL || 'https://mainnet.infura.io/v3/YOUR_API_KEY',
      chainId: 1,
      accounts,
    },
    rinkeby: {
      url: process.env.WEB3_PROVIDER_URL || 'https://rinkeby.infura.io/v3/YOUR_API_KEY',
      chainId: 4,
      accounts,
    },
    matic: {
      url: process.env.WEB3_PROVIDER_URL || 'https://polygon-rpc.com',
      chainId: 137,
      accounts,
    },
    celo: {
      url: process.env.WEB3_PROVIDER_URL || 'https://forno.celo.org',
      chainId: 42220,
      accounts,
    },
    bsctest: {
      url: process.env.WEB3_PROVIDER_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      accounts,
    },
    bsc: {
      url: process.env.WEB3_PROVIDER_URL || 'https://bsc-dataseed1.binance.org',
      chainId: 56,
      accounts,
    },
    xdai: {
      url: process.env.WEB3_PROVIDER_URL || 'https://rpc.xdaichain.com/',
      chainId: 100,
      accounts,
    },
    fantom: {
      url: process.env.WEB3_PROVIDER_URL || 'https://rpcapi.fantom.network',
      chainId: 250,
      accounts,
    },
	arbitrum: {
        url: process.env.WEB3_PROVIDER_URL || 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
        accounts,
    },
    arbitrumtest: {
        url: process.env.WEB3_PROVIDER_URL || 'https://rinkeby.arbitrum.io/rpc',
        chainId: 421611,
        accounts
    },
  },
  etherscan: {
    // Can be overridden according to the network (set-explorer-api-key)
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
};

// Override the default API key for non-Etherscan explorers
const setExplorerApiKey = (hre: HardhatRuntimeEnvironment) => {
  switch (hre.network.name) {
    case 'bsc':
    case 'bsctestnet': {
      hre.config.etherscan.apiKey = process.env.BSCSCAN_API_KEY;
      return;
    }
    case 'matic':
    case 'mumbai': {
      hre.config.etherscan.apiKey = process.env.POLYGONSCAN_API_KEY;
      return;
    }
    case 'fantom': {
      hre.config.etherscan.apiKey = process.env.FTMSCAN_API_KEY;
      return;
    }
  }
};

// FIXME: use deployAllPaymentContracts instead to test with the same deployments
task('deploy-local-env', 'Deploy a local environment').setAction(async (args, hre) => {
  args.force = true;
  await deployAllContracts(args, hre)
  console.log('All contracts (re)deployed locally');
});

task(
  'deploy-live-payments',
  'Deploy payment contracts on a live network. Make sure to update all artifacts before running.',
)
  .addFlag('dryRun', 'to prevent any deployment')
  .addFlag('force', 'to force re-deployment')
  .setAction(async (args, hre) => {
    args.force = args.force ?? false;
    args.dryRun = args.dryRun ?? false;
    args.simulate = args.dryRun;
    setExplorerApiKey(hre);
    await deployAllPaymentContracts(args, hre);
  });

task(
  'prepare-live-payments',
  'Run ERC20 approval transactions for Swap Conversion, with the second signer (FIXME with missing tasks).',
).setAction(async (_args, hre) => {
  await preparePayments(hre);
});
