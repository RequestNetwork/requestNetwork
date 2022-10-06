import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { config } from 'dotenv';
import { deployOne } from './scripts/deploy-one';

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
    ronin: {
      url: process.env.WEB3_PROVIDER_URL,
      chainId: 2022,
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

task('deploy-erc20-payment', 'Deploy ERC20 payment contract on a permissioned network.')
  .addFlag('dryRun', 'to prevent any deployment')
  .addFlag('force', 'to force re-deployment')
  .setAction(async (args, hre) => {
    args.force = args.force ?? false;
    args.dryRun = args.dryRun ?? false;
    args.simulate = args.dryRun;
    const { address: ERC20FeeProxyAddress } = await deployOne(args, hre, 'ERC20FeeProxy');
    console.log('ERC20FeeProxy Contract deployed: ' + ERC20FeeProxyAddress);
  });
