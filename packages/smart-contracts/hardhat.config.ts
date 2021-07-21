import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import deployRequest from './scripts/1_deploy-request-storage';
import deployPayment from './scripts/2_deploy-main-payments';
import deployConversion from './scripts/3_deploy_chainlink_contract';

export default {
  solidity: '0.5.17',
  paths: {
    sources: 'src/contracts',
    tests: 'test/contracts',
    artifacts: 'build',
  },
  networks: {
    private: {
      url: 'http://127.0.0.1:8545',
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/a84806bba3e44dd9a7c676a529ec1abd',
      chainId: 4,
      // TODO should change
      accounts: ['04ffa7316c2264ef3325da9f878640db7195f0d9adbcfdcf6ce57d0940746d47'],
    },
  },
  etherscan: {
    apiKey: '9GET7DGKSMY9SPNJC7633MDS4IDVNU8B63',
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
};

task('deploy-local-env', 'Deploy a local environment').setAction(async (args, hre) => {
  args.force = true;
  await deployRequest(args, hre);
  await deployPayment(args, hre);
  await deployConversion(args, hre);
  console.log('All contracts (re)deployed locally');
});
