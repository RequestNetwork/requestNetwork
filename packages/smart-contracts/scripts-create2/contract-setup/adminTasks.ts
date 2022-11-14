import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber, Wallet } from 'ethers';
import utils from '@requestnetwork/utils';
import { HardhatRuntimeEnvironmentExtended } from '../types';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: .3%
export const BATCH_FEE = 3;

/**
 * Updates the chainlink address used by the contract.
 * @param contract A contract using chainlink:
 *                 Erc20ConversionProxy | EthConversionProxy | ERC20SwapToConversion.
 * @param network The network used.
 * @param gasPrice The gas price used.Increase its value if needed.
 * @param version The version of the chainlink proxy to use, the last one by default.
 */
export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
  version = undefined,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, version);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    const tx = await contract.updateConversionPathAddress(chainlinkConversionPathAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
    console.log(
      `chainlink: the current address ${currentChainlinkAddress} has been replaced by: ${chainlinkConversionPathAddress}`,
    );
  }
};

export const updateSwapRouter = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
    const tx = await contract.setRouter(uniswapV2RouterAddresses[network], {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};

export const updateRequestSwapFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees: BigNumber = await contract.requestSwapFees();
  if (!currentFees.eq(REQUEST_SWAP_FEES)) {
    const tx = await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, { gasPrice: gasPrice });
    await tx.wait(1);
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${REQUEST_SWAP_FEES}`);
  }
};

export const updateBatchPaymentFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees: BigNumber = await contract.batchFee();
  if (!currentFees.eq(BATCH_FEE)) {
    const tx = await contract.setBatchFee(BATCH_FEE, { gasPrice: gasPrice });
    await tx.wait(1);
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE}`);
  }
};

/**
 * Update the address of a Native or ERC20 fee proxy stored within a Native or ERC20 fee conversion contract
 * @param contract A contract using chainlink: EthConversionProxy | Erc20ConversionProxy.
 * @param network The network used.
 * @param gasPrice The gas price used.Increase its value if needed.
 * @param proxyType The type of the proxy fee.
 * @param version The version of the fee proxy to use, the last one by default.
 */
export const updatePaymentFeeProxyAddress = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
  proxyType: 'native' | 'erc20',
  version = undefined,
): Promise<void> => {
  let proxyAddress: string;
  let currentAddress: string;
  if (proxyType === 'native') {
    proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network, version);
    currentAddress = await contract.paymentProxy();
  } else {
    proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network, version);
    currentAddress = await contract.paymentProxy();
  }

  if (currentAddress.toLocaleLowerCase() !== proxyAddress.toLocaleLowerCase()) {
    const tx = await contract.updateConversionProxyAddress(proxyAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait();
    console.log(
      `${proxyType} conversion proxy: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
  }
};

/** legacy from BatchPayment */
export const updatePaymentErc20FeeProxy = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
  const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
  const currentAddress = await contract.paymentErc20FeeProxy();
  if (currentAddress !== erc20FeeProxyAddress) {
    const tx = await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};

/** legacy from BatchPayment */
export const updatePaymentEthFeeProxy = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const ethereumFeeProxy = artifacts.ethereumFeeProxyArtifact;
  const ethereumFeeProxyAddress = ethereumFeeProxy.getAddress(network);
  const currentAddress = await contract.paymentEthFeeProxy();
  if (currentAddress !== ethereumFeeProxyAddress) {
    const tx = await contract.setPaymentEthFeeProxy(ethereumFeeProxyAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};

export const getSignerAndGasPrice = async (
  network: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<{ signer: Wallet; gasPrice: BigNumber }> => {
  let provider;
  if (network === 'celo') {
    provider = utils.getCeloProvider();
  } else {
    provider = utils.getDefaultProvider(network);
  }
  const signer = new hre.ethers.Wallet(hre.config.xdeploy.signer).connect(provider);
  const gasPrice = await provider.getGasPrice();

  return {
    signer,
    gasPrice,
  };
};
