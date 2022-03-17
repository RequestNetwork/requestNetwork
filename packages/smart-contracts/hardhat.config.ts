import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { subtask, task } from 'hardhat/config';
import { config } from 'dotenv';
import deployAllContracts from './scripts/5_deploy-all';
import { deployAllPaymentContracts } from './scripts/deploy-payments';
import { preparePayments } from './scripts/prepare-payments';
import { checkCreate2Deployer } from './scripts-create2/check-deployer';
import { deployWithCreate2FromList } from './scripts-create2/deploy-from-list';
import deployDeployer from './scripts-create2/deploy-request-deployer';
import { computeCreate2DeploymentAddressesFromList } from './scripts-create2/compute-from-list';
import VerifyCreate2FromList from './scripts-create2/verify-from-list';
import { HardhatRuntimeEnvironmentExtended } from './scripts-create2/types';

config();

const accounts = process.env.DEPLOYMENT_PRIVATE_KEY
  ? [process.env.DEPLOYMENT_PRIVATE_KEY]
  : process.env.DEPLOYER_MASTER_KEY
  ? [process.env.DEPLOYER_MASTER_KEY]
  : process.env.ADMIN_PRIVATE_KEY
  ? [process.env.ADMIN_PRIVATE_KEY]
  : undefined;

if (accounts && process.env.ADMIN_PRIVATE_KEY) {
  accounts.push(process.env.ADMIN_PRIVATE_KEY);
}

const DEPLOYER_KEY_GUARD = 'DEPLOYER_KEY_GUARD';

// Request deployer address on local blockchain
const LOCAL_DEPLOYER_ADDRESS = '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0';

// Request deployer address on live blockchains
const LIVE_DEPLOYER_ADDRESS = '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2';

// Arbitrary data used to deploy our contracts at predefined addresses
const REQUEST_SALT = '0x0679724da7211bc62502a39f41cbf818fc7132c266e7c819fc2b06fad9593655';

const requestDeployer = process.env.REQUEST_DEPLOYER_LIVE
  ? LIVE_DEPLOYER_ADDRESS
  : LOCAL_DEPLOYER_ADDRESS;

export default {
  solidity: '0.8.9',
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
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      opera: process.env.FTMSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumTestnet: process.env.ARBISCAN_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY,
      xdai: 'api-key',
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
  xdeploy: {
    salt: REQUEST_SALT,
    signer: process.env.ADMIN_PRIVATE_KEY,
    networks: ['celo'],
    rpcUrls: ['https://forno.celo.org'],
    gasLimit: undefined,
    deployerAddress: requestDeployer,
  },
};

// FIXME: use deployAllPaymentContracts instead to test with the same deployments
task('deploy-local-env', 'Deploy a local environment').setAction(async (args, hre) => {
  args.force = true;
  await hre.run(DEPLOYER_KEY_GUARD);
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
    await hre.run(DEPLOYER_KEY_GUARD);
    await deployAllPaymentContracts(args, hre as HardhatRuntimeEnvironmentExtended);
  });

task(
  'prepare-live-payments',
  'Run ERC20 approval transactions for Swap Conversion, with the second signer (FIXME with missing tasks).',
).setAction(async (_args, hre) => {
  await hre.run(DEPLOYER_KEY_GUARD);
  await preparePayments(hre);
});

// Tasks inherent to the CREATE2 deployment scheme
task(
  'deploy-deployer-contract',
  'Deploy request deployer contract on the specified network',
).setAction(async (_args, hre) => {
  await deployDeployer(hre);
});

task(
  'compute-contract-addresses',
  'Compute the contract addresses from the Create2DeploymentList using the create2 scheme',
).setAction(async (_args, hre) => {
  await computeCreate2DeploymentAddressesFromList(hre as HardhatRuntimeEnvironmentExtended);
});

task(
  'deploy-contract-through-deployer',
  'Deploy the contracts from the Create2DeploymentList using the create2 scheme',
).setAction(async (_args, hre) => {
  await checkCreate2Deployer(hre as HardhatRuntimeEnvironmentExtended);
  await deployWithCreate2FromList(hre as HardhatRuntimeEnvironmentExtended);
});

task(
  'verify-contract-from-deployer',
  'Verify the contracts from the Create2DeploymentList for a specific network',
).setAction(async (_args, hre) => {
  await VerifyCreate2FromList(hre as HardhatRuntimeEnvironmentExtended);
});

subtask(DEPLOYER_KEY_GUARD, 'prevent usage of the deployer master key').setAction(async () => {
  if (accounts && accounts[0] === process.env.DEPLOYER_MASTER_KEY) {
    throw new Error('The deployer master key should not be used for this action');
  }
});
