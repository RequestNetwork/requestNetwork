import { Contract } from 'ethers';
import * as artefacts from '../src/lib';

/**
 * List of smart contract that we deploy using the CREATE2 scheme thourhg the Request Deployer contract
 */
export const create2ContractDeploymentList = ['EthereumProxy', 'EthereumFeeProxy'];

/**
 * Returns the artefact of the specified contract
 * @param contract name of the contract
 */
export const getArtefact = (contract: string): artefacts.ContractArtifact<Contract> => {
  switch (contract) {
    case 'RequestHashStorage':
      return artefacts.requestHashStorageArtifact;
    case 'RequestOpenHashSubmitter':
      return artefacts.requestHashSubmitterArtifact;
    case 'ERC20Proxy':
      return artefacts.erc20ProxyArtifact;
    case 'ERC20FeeProxy':
      return artefacts.erc20FeeProxyArtifact;
    case 'EthereumProxy':
      return artefacts.ethereumProxyArtifact;
    case 'EthereumFeeProxy':
      return artefacts.ethereumFeeProxyArtifact;
    case 'ChainlinkConversionPath':
      return artefacts.chainlinkConversionPath;
    case 'Erc20ConversionProxy':
      return artefacts.erc20ConversionProxy;
    case 'EthConversionProxy':
      return artefacts.ethConversionArtifact;
    case 'ERC20SwapToPay':
      return artefacts.erc20SwapToPayArtifact;
    case 'ERC20SwapToConversion':
      return artefacts.erc20SwapConversionArtifact;
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
  const contractArtefact = getArtefact(contract);
  const addresses = contractArtefact.getAllAddresses(network);
  return addresses.some((x) => x.address === computedAddress);
};
