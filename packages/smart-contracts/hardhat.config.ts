import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { subtask, task } from 'hardhat/config';
import { config } from 'dotenv';
import deployAllContracts from './scripts/test-deploy-all';
import { deployAllPaymentContracts } from './scripts/deploy-payments';
import { checkCreate2Deployer } from './scripts-create2/check-deployer';
import { deployDeployer } from './scripts-create2/deploy-request-deployer';
import { HardhatRuntimeEnvironmentExtended } from './scripts-create2/types';
import { computeCreate2DeploymentAddressesFromList } from './scripts-create2/compute-one-address';
import { VerifyCreate2FromList } from './scripts-create2/verify';
import { deployWithCreate2FromList } from './scripts-create2/deploy';
import { NUMBER_ERRORS } from './scripts/utils';
import { networkRpcs } from '@requestnetwork/utils';
import { tenderlyImportAll } from './scripts-create2/tenderly';
import { updateContractsFromList } from './scripts-create2/update-contracts-setup';

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

const url = (network: string): string => process.env.WEB3_PROVIDER_URL || networkRpcs[network];

export default {
  solidity: '0.8.9',
  paths: {
    sources: 'src/contracts',
    tests: 'test/contracts',
    artifacts: 'build',
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
      },
      hardfork: 'london',
    },
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
    goerli: {
      url: process.env.WEB3_PROVIDER_URL || 'https://goerli.infura.io/v3/YOUR_API_KEY',
      chainId: 5,
      accounts,
    },
    matic: {
      url: url('matic'),
      chainId: 137,
      accounts,
    },
    celo: {
      url: url('celo'),
      chainId: 42220,
      accounts,
    },
    bsctest: {
      url: url('bsctest'),
      chainId: 97,
      accounts,
    },
    bsc: {
      url: url('bsc'),
      chainId: 56,
      accounts,
    },
    xdai: {
      url: url('xdai'),
      chainId: 100,
      accounts,
    },
    fuse: {
      url: url('fuse'),
      chainId: 122,
      accounts,
    },
    fantom: {
      url: url('fantom'),
      chainId: 250,
      accounts,
    },
    'arbitrum-one': {
      url: url('arbitrum-one'),
      chainId: 42161,
      accounts,
    },
    'arbitrum-rinkeby': {
      url: url('arbitrum-rinkeby'),
      chainId: 421611,
      accounts,
    },
    avalanche: {
      url: url('avalanche'),
      chainId: 43114,
      accounts,
    },
    optimism: {
      url: url('optimism'),
      chainId: 10,
      accounts,
    },
    moonbeam: {
      url: url('moonbeam'),
      chainId: 1284,
      accounts,
    },
    tombchain: {
      url: url('tombchain'),
      chainId: 6969,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
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
      // xdai
      xdai: process.env.GNOSISSCAN_API_KEY,
      // optimism
      optimism: process.env.OPTIMISM_API_KEY,
      // moonbeam
      moonbeam: process.env.MOONBEAM_API_KEY,
      // other networks don't need an API key, but you still need
      // to specify one; any string placeholder will work
      sokol: 'api-key',
      aurora: 'api-key',
      auroraTestnet: 'api-key',
    },
    customChains: [
      {
        network: 'optimism',
        chainId: 10,
        urls: {
          apiURL: 'https://api-optimistic.etherscan.io/api',
          browserURL: 'https://optimistic.etherscan.io/',
        },
      },
    ],
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT,
    username: process.env.TENDERLY_USERNAME,
    accessKey: process.env.TENDERLY_ACCESS_KEY,
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
    networks: process.env.NETWORK
      ? [process.env.NETWORK]
      : [
          'mainnet',
          'matic',
          'bsc',
          'celo',
          'xdai',
          'fuse',
          'arbitrum-one',
          'fantom',
          'avalanche',
          'optimism',
          'moonbeam',
        ],
    gasLimit: undefined,
    deployerAddress: requestDeployer,
  },
};

// FIXME: use deployAllPaymentContracts instead to test with the same deployments
task('deploy-local-env', 'Deploy a local environment').setAction(async (args, hre) => {
  args.force = true;
  await deployAllContracts(args, hre);
  if (NUMBER_ERRORS > 0) {
    console.log(`Deployment failed, please check the ${NUMBER_ERRORS} errors`);
  } else {
    console.log('All contracts (re)deployed locally');
  }
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
  await hre.run('compile');
  await computeCreate2DeploymentAddressesFromList(hre as HardhatRuntimeEnvironmentExtended);
});

task(
  'deploy-contracts-through-deployer',
  'Deploy the contracts from the Create2DeploymentList using the create2 scheme',
).setAction(async (_args, hre) => {
  await checkCreate2Deployer(hre as HardhatRuntimeEnvironmentExtended);
  await deployWithCreate2FromList(hre as HardhatRuntimeEnvironmentExtended);
});

task(
  'update-contracts',
  'Update the latest deployed contracts from the Create2DeploymentList',
).setAction(async (_args, hre) => {
  await hre.run(DEPLOYER_KEY_GUARD);
  await updateContractsFromList(hre as HardhatRuntimeEnvironmentExtended);
});

task(
  'verify-contract-from-deployer',
  'Verify the contracts from the Create2DeploymentList for a specific network',
).setAction(async (_args, hre) => {
  await VerifyCreate2FromList(hre as HardhatRuntimeEnvironmentExtended);
});

task('tenderly-monitor-contracts', 'Import all contracts to a Tenderly account').setAction(
  async (_args, hre) => {
    await tenderlyImportAll(hre as HardhatRuntimeEnvironmentExtended);
  },
);

subtask(DEPLOYER_KEY_GUARD, 'prevent usage of the deployer master key').setAction(async () => {
  if (accounts && accounts[0] === process.env.DEPLOYER_MASTER_KEY) {
    throw new Error('The deployer master key should not be used for this action');
  }
});
