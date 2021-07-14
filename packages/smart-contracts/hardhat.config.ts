import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import { deploy as deployERC20ConversionProxy } from './scripts/erc20-conversion-proxy';
import { deploy as deployERC20SwapToConversion } from './scripts/erc20-swap-to-conversion';
import { deploy as deployRequest } from './scripts/1_deploy-request-storage';
import { deploy as deployPayment } from './scripts/2_deploy-main-payments';
import { deploy as deployConversion } from './scripts/3_deploy_chainlink_contract';
import { deploy } from './scripts/deploy-one';
import { chainlinkConversionPath, erc20FeeProxyArtifact } from '.';

task('deploy-all')
  .addFlag(
    'force',
    'Forces the deployments even if some addresses are configured for the given network',
  )
  .setAction(async (args, hre) => {
    const erc20FeeProxyAddress = await deploy(args, hre, erc20FeeProxyArtifact, 'ERC20FeeProxy');
    const chainlinkConversionPathAddress = await deploy(
      args,
      hre,
      chainlinkConversionPath,
      'ChainlinkConversionPath',
    );
    const conversionProxyAddress = await deployERC20ConversionProxy(
      {
        ...args,
        chainlinkConversionPathAddress,
        erc20FeeProxyAddress,
      },
      hre,
    );
    await hre.run('deploy-swapToConversion', { ...args, conversionProxyAddress });
  });

task('deploy-chainlinkConversionPath')
  .addFlag('force', 'Forces the deployment even if an address is configured for the given network')
  .setAction(async (args, hre) => {
    await deploy(args, hre, chainlinkConversionPath, 'ChainlinkConversionPath');
  });

task('deploy-ERC20ConversionProxy')
  .addFlag('force', 'Forces the deployment even if an address is configured for the given network')
  .addOptionalParam('chainlinkConversionPathAddress')
  .setAction(async (args, hre) => {
    await deployERC20ConversionProxy(args, hre);
  });

task('deploy-swapToConversion')
  .addFlag('force', 'Forces the deployment even if an address is configured for the given network')
  .addOptionalParam('conversionProxyAddress')
  .setAction(async (args, hre) => {
    await deployERC20SwapToConversion(args, hre);
  });

task('deploy-local-env').setAction(async (args, hre) => {
  args.force = true;
  await deployRequest(args, hre);
  await deployPayment(args, hre);
  await deployConversion(args, hre);
  console.log('Done');
});

export default {
  solidity: '0.5.17',
  paths: {
    sources: 'src/contracts',
    tests: 'test/contracts',
  },
  networks: {
    private: {
      url: 'http://127.0.0.1:8545',
      // accounts: [
      //   '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
      //   '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
      // ],
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
};
