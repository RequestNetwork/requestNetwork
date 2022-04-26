import { Contract } from 'ethers';
import * as artifacts from '../src/lib';

/**
 * List of smart contract that we deploy using the CREATE2 scheme thourhg the Request Deployer contract
 */
export const create2ContractDeploymentList = [
  'EthereumProxy',
  'EthereumFeeProxy',
  'Erc20ConversionProxy',
  'ERC20SwapToConversion',
  'ERC20EscrowToPay',
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
    default:
      throw new Error('Contract unknown');
  }
};

/**
 * Check if a contract has already been dployed on a specific network at a specific address
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
  const contractArtifact = getArtifact(contract);
  const addresses = contractArtifact.getAllAddresses(network);
  return addresses.some((x) => x.address === computedAddress);
};
