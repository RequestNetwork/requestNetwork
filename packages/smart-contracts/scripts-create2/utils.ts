import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { XdeployConfig } from 'xdeployer/src/types';
import * as artefacts from '../src/lib';

export type HardhatRuntimeEnvironmentExtended = HardhatRuntimeEnvironment & {
  config: {
    xdeploy: XdeployConfig;
  };
};

export interface IDeploymentParams {
  contract: string;
  constructorArgs?: Array<any>;
}

/**
 * List of smart contract that we deploy using the CREATE2 scheme thourhg the Request Deployer contract
 */
export const create2ContractDeploymentList = ['EthereumProxy', 'EthereumFeeProxy'];

/**
 * List of contract addresses with the same interface as Uniswap V2 Router.
 * Used for SwapToPay and SwapToConvert.
 */
export const uniswapV2RouterAddresses: Record<string, string> = {
  mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ropsten: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  rinkeby: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  kovan: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  private: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  localhost: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  bsctest: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  xdai: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77',
  // https://layer3.gitbook.io/spirit-swap/contracts
  fantom: '0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52',
  // https://github.com/QuickSwap/quickswap-core
  matic: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  // https://app.ubeswap.org/#/swap
  celo: '0x7D28570135A2B1930F331c507F65039D4937f66c',
  // No swap v2 found
  'arbitrum-rinkeby': '0x0000000000000000000000000000000000000000',
  'arbitrum-one': '0x0000000000000000000000000000000000000000',
  avalanche: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
};

/**
 * List of native token hash per network.
 * Used ChainlinkConversionPath and EthConversionProxy.
 */
export const nativeTokenHash: Record<string, string> = {
  mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ropsten: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  rinkeby: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  kovan: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  private: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  localhost: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  bsctest: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  xdai: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77',
  // https://layer3.gitbook.io/spirit-swap/contracts
  fantom: '0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52',
  // https://github.com/QuickSwap/quickswap-core
  matic: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  // https://app.ubeswap.org/#/swap
  celo: '0x7D28570135A2B1930F331c507F65039D4937f66c',
  // No swap v2 found
  'arbitrum-rinkeby': '0x0000000000000000000000000000000000000000',
  'arbitrum-one': '0x0000000000000000000000000000000000000000',
  avalanche: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
};

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
