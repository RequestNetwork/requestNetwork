import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { config } from 'dotenv';
import deployAllContracts from './scripts/5_deploy-all';
import { deployAllPaymentContracts } from './scripts/deploy-payments';
import { preparePayments } from './scripts/prepare-payments';

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
    fuse: {
      url: process.env.WEB3_PROVIDER_URL || 'https://rpc.fuse.io',
      chainId: 122,
      accounts,
    },
    fantom: {
      url: process.env.WEB3_PROVIDER_URL || 'https://rpcapi.fantom.network',
      chainId: 250,
      accounts,
    },
    'arbitrum-one': {
      url: process.env.WEB3_PROVIDER_URL || 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      accounts,
    },
    'arbitrum-rinkeby': {
      url: process.env.WEB3_PROVIDER_URL || 'https://rinkeby.arbitrum.io/rpc',
      chainId: 421611,
      accounts,
    },
    avalanche: {
      url: process.env.WEB3_PROVIDER_URL || 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      // binance smart chain
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      // fantom mainnet
      opera: process.env.FTMSCAN_API_KEY,
      // polygon
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      // arbitrum
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      // avalanche
      avalanche: process.env.SNOWTRACE_API_KEY,
      // xdai and sokol don't need an API key, but you still need
      // to specify one; any string placeholder will work
      xdai: 'api-key',
      sokol: 'api-key',
      aurora: 'api-key',
      auroraTestnet: 'api-key',
    },
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
  mocha: {
    timeout: 60000, // Usefull on test networks
  },
};

// FIXME: use deployAllPaymentContracts instead to test with the same deployments
task('deploy-local-env', 'Deploy a local environment').setAction(async (args, hre) => {
  args.force = true;
  await deployAllContracts(args, hre);
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
    await deployAllPaymentContracts(args, hre);
  });

task(
  'prepare-live-payments',
  'Run ERC20 approval transactions for Swap Conversion, with the second signer (FIXME with missing tasks).',
).setAction(async (_args, hre) => {
  await preparePayments(hre);
});
