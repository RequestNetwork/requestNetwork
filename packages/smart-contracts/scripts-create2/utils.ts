import { Contract } from 'ethers';
import * as artifacts from '../src/lib';
import { EvmChains } from '@requestnetwork/currency';

/**
 * List of smart contract that we deploy using the CREATE2 scheme through the Request Deployer contract
 * By default all smart contracts from bellow will get deployed.
 * If you want to skip deploying one or more, then comment them out in the list bellow.
 */
export const create2ContractDeploymentList = [
  'ChainlinkConversionPath',
  'EthereumProxy',
  'EthereumFeeProxy',
  'EthConversionProxy',
  'ERC20Proxy',
  'ERC20FeeProxy',
  'Erc20ConversionProxy',
  'ERC20SwapToPay',
  'ERC20SwapToConversion',
  'BatchConversionPayments',
  'ERC20EscrowToPay',
  'ERC20TransferableReceivable',
  'SingleRequestProxyFactory',
];

/**
 * Returns the artifact of the specified contract
 * @param contract name of the contract
 */
export const getArtifact = (contract: string): artifacts.ContractArtifact<Contract> => {
  switch (contract) {
    case 'RequestHashStorage':
      return artifacts.requestHashStorageArtifact;
    case 'RequestOpenHashSubmitter':
      return artifacts.requestHashSubmitterArtifact;
    case 'ERC20Proxy':
      return artifacts.erc20ProxyArtifact;
    case 'ERC20FeeProxy':
      return artifacts.erc20FeeProxyArtifact;
    case 'EthereumProxy':
      return artifacts.ethereumProxyArtifact;
    case 'EthereumFeeProxy':
      return artifacts.ethereumFeeProxyArtifact;
    case 'ChainlinkConversionPath':
      return artifacts.chainlinkConversionPath;
    case 'Erc20ConversionProxy':
      return artifacts.erc20ConversionProxy;
    case 'EthConversionProxy':
      return artifacts.ethConversionArtifact;
    case 'ERC20SwapToPay':
      return artifacts.erc20SwapToPayArtifact;
    case 'ERC20SwapToConversion':
      return artifacts.erc20SwapConversionArtifact;
    case 'ERC20EscrowToPay':
      return artifacts.erc20EscrowToPayArtifact;
    case 'BatchConversionPayments':
      return artifacts.batchConversionPaymentsArtifact;
    case 'ERC20TransferableReceivable':
      return artifacts.erc20TransferableReceivableArtifact;
    case 'SingleRequestProxyFactory':
      return artifacts.singleRequestForwarderFactoryArtifact;
    default:
      throw new Error('Contract unknown');
  }
};

/**
 * Check if a contract has already been deployed on a specific network at a specific address
 * @param contract name of the contract
 * @param network name of the network
 * @param computedAddress address to check
 * @returns a boolean
 */
export const isContractDeployed = (
  contract: string,
  network: string,
  computedAddress: string,
): boolean => {
  try {
    EvmChains.assertChainSupported(network);
    const contractArtifact = getArtifact(contract);
    const addresses = contractArtifact.getAllAddresses(network);
    return addresses.some((x) => x.address === computedAddress);
  } catch (e) {
    return false;
  }
};
