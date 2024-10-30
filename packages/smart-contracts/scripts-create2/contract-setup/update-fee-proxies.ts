import {
  singleRequestProxyFactoryArtifact,
  erc20FeeProxyArtifact,
  ethereumFeeProxyArtifact,
} from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getSignerAndGasFees } from './adminTasks';
import { EvmChains } from '@requestnetwork/currency';
import { executeContractMethod } from './execute-contract-method';
import { Contract } from 'ethers';

/**
 * Update the proxy addresses in the SingleRequestProxyFactory contract
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EOA
 */
export const updateFeeProxies = async (
  hre: HardhatRuntimeEnvironmentExtended,
  signWithEoa: boolean,
): Promise<void> => {
  for (const network of hre.config.xdeploy.networks) {
    try {
      EvmChains.assertChainSupported(network);

      const factoryAddress = singleRequestProxyFactoryArtifact.getAddress(network);
      const erc20ProxyAddress = erc20FeeProxyArtifact.getAddress(network);
      const ethereumProxyAddress = ethereumFeeProxyArtifact.getAddress(network);

      if (!factoryAddress || !erc20ProxyAddress || !ethereumProxyAddress) {
        console.info(`Missing contract deployment on ${network}`);
        continue;
      }

      const { signer, txOverrides } = await getSignerAndGasFees(network, hre);

      const factory = new Contract(factoryAddress, factoryAbi, signer);

      // Check current values
      const currentErc20Proxy = await factory.erc20FeeProxy();
      const currentEthereumProxy = await factory.ethereumFeeProxy();

      // Update ERC20 proxy if needed
      if (currentErc20Proxy.toLowerCase() !== erc20ProxyAddress.toLowerCase()) {
        await executeContractMethod({
          network,
          contract: factory,
          method: 'setERC20FeeProxy',
          props: [erc20ProxyAddress],
          txOverrides,
          signer,
          signWithEoa,
        });
        console.log(`Updated ERC20FeeProxy to ${erc20ProxyAddress} on ${network}`);
      } else {
        console.log(`ERC20FeeProxy is already set to ${erc20ProxyAddress} on ${network}`);
      }

      // Update Ethereum proxy if needed
      if (currentEthereumProxy.toLowerCase() !== ethereumProxyAddress.toLowerCase()) {
        await executeContractMethod({
          network,
          contract: factory,
          method: 'setEthereumFeeProxy',
          props: [ethereumProxyAddress],
          txOverrides,
          signer,
          signWithEoa,
        });
        console.log(`Updated EthereumFeeProxy to ${ethereumProxyAddress} on ${network}`);
      } else {
        console.log(`EthereumFeeProxy is already set to ${ethereumProxyAddress} on ${network}`);
      }
    } catch (err) {
      console.warn(`An error occurred updating proxies on ${network}`);
      console.warn(err);
    }
  }
};

const factoryAbi = [
  'function erc20FeeProxy() view returns (address)',
  'function ethereumFeeProxy() view returns (address)',
  'function setERC20FeeProxy(address _newERC20FeeProxy)',
  'function setEthereumFeeProxy(address _newEthereumFeeProxy)',
];
