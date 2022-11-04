import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: .3%
export const BATCH_FEE = 3;

/**
 * It update the chainlink address used by the "contract.
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
    await tx.wait();
    console.log(
      `chainlink: the current address ${currentChainlinkAddress} has been replaced by: ${chainlinkConversionPathAddress}`,
    );
  }
};

export const updateSwapRouter = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
    await contract.setRouter(uniswapV2RouterAddresses[network], {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};

export const updateRequestSwapFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.requestSwapFees();
  if (currentFees !== REQUEST_SWAP_FEES) {
    await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, { nonce: nonce, gasPrice: gasPrice });
  }
};

export const updateBatchPaymentFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.batchFee();
  if (currentFees !== BATCH_FEE) {
    // Log is useful to have a direct view on was is being updated
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE}`);
    await contract.setBatchFee(BATCH_FEE, { nonce: nonce, gasPrice: gasPrice });
  }
};

/**
 * Update the address of a Native or ERC20 fee proxy stored within a Native or ERC20 fee conversion contract
 * @param contract A contract using chainlink: EthConversionProxy | Erc20ConversionProxy.
 * @param network The network used.
 * @param gasPrice The gas price used.Increase its value if needed.
 * @param proxyType The type of the proxy fee.
 * @param version The version of the fee proxy to use, the last one by default.
 * */
export const updateConversionProxyAddress = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
  proxyType: 'native' | 'erc20',
  version = undefined,
): Promise<void> => {
  try {
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
  } catch (e) {
    console.log(`Cannot update ${proxyType} conversion proxy, it might not exist on this network`);
    console.log(e);
  }
};

export const updatePaymentErc20FeeProxy = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
  const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
  const currentAddress = await contract.paymentErc20FeeProxy();
  if (currentAddress !== erc20FeeProxyAddress) {
    await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};

export const updatePaymentEthFeeProxy = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const ethereumFeeProxy = artifacts.ethereumFeeProxyArtifact;
  const ethereumFeeProxyAddress = ethereumFeeProxy.getAddress(network);
  const currentAddress = await contract.paymentEthFeeProxy();
  if (currentAddress !== ethereumFeeProxyAddress) {
    await contract.setPaymentEthFeeProxy(ethereumFeeProxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};
