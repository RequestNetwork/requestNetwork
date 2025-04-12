import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber, Overrides, Wallet, Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { parseUnits } from 'ethers/lib/utils';
import {
  isEip1559Supported,
  getCeloProvider,
  getDefaultProvider,
  normalizeGasFees,
} from '@requestnetwork/utils';
import { CurrencyTypes } from '@requestnetwork/types';
import { suggestFeesEip1559 } from '../fee-suggestion';
import { executeContractMethod } from './execute-contract-method';

// Swap Fees: set to 5 for 0.5%
const REQUEST_SWAP_FEES = 0;
// Batch Fees: set to 30 for 0.3%
const BATCH_FEE = BigNumber.from(0);

// Batch fee amount in USD Limit: 150 * 1e8 ($150)
const BATCH_FEE_AMOUNT_USD_LIMIT = parseUnits('150', 8);

/**
 * Updates the chainlink address used by the contract.
 * @param contract A contract using chainlink:
 *                 Erc20ConversionProxy | EthConversionProxy | ERC20SwapToConversion.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 * @param version The version of the chainlink proxy to use, the last one by default.
 */
export const updateChainlinkConversionPath = async (
  contract: Contract,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
  version?: string,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, version);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    await executeContractMethod({
      network,
      contract,
      method: 'updateConversionPathAddress',
      props: [chainlinkConversionPathAddress],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `chainlink: the current address ${currentChainlinkAddress} has been replaced by: ${chainlinkConversionPathAddress}`,
    );
  }
};

/**
 * Updates the batchFee applied by the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param network The network used
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateSwapRouter = async (
  contract: Contract,
  network: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  const expectedRouter = uniswapV2RouterAddresses[network];
  if (expectedRouter && currentSwapRouter !== expectedRouter) {
    await executeContractMethod({
      network,
      contract,
      method: 'setRouter',
      props: [expectedRouter],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(`Swap router address set to ${expectedRouter}`);
  }
};

/**
 * Updates the batchFee applied by the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param network The network used
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateRequestSwapFees = async (
  contract: Contract,
  network: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentFees: BigNumber = await contract.requestSwapFees();
  if (!currentFees.eq(REQUEST_SWAP_FEES)) {
    await executeContractMethod({
      network,
      contract,
      method: 'updateRequestSwapFees',
      props: [REQUEST_SWAP_FEES],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `currentFees: ${currentFees.toNumber() / 10}%, new fees: ${REQUEST_SWAP_FEES / 10}%`,
    );
  }
};

/**
 * Updates the batchFee applied by the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param network The network used
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateBatchPaymentFees = async (
  contract: Contract,
  network: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentFees: BigNumber = await contract.batchFee();
  if (!BATCH_FEE.eq(currentFees)) {
    await executeContractMethod({
      network,
      contract,
      method: 'setBatchFee',
      props: [BATCH_FEE],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(`Batch: currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE.toString()}`);
  }
};

/**
 * Updates the feeAMountUSDLimit of the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param network The network used
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateBatchPaymentFeeAmountUSDLimit = async (
  contract: Contract,
  network: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentFeeAmountUSDLimit: BigNumber = await contract.batchFeeAmountUSDLimit();
  if (!currentFeeAmountUSDLimit.eq(BATCH_FEE_AMOUNT_USD_LIMIT)) {
    await executeContractMethod({
      network,
      contract,
      method: 'setBatchFeeAmountUSDLimit',
      props: [BATCH_FEE_AMOUNT_USD_LIMIT],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `Batch: the current fee amount in USD limit: ${currentFeeAmountUSDLimit.toString()}, have been replaced by: ${BATCH_FEE_AMOUNT_USD_LIMIT.toString()}. ($1 = 1e8)`,
    );
  }
};

/**
 * Updates the address of a Native or ERC20 fee proxy stored within a Native or ERC20 fee conversion contract.
 * @param contract A contract using chainlink: EthConversionProxy | Erc20ConversionProxy.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param proxyType The type of the proxy fee.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 * @param version The version of the fee proxy to use, the last one by default.
 */
export const updatePaymentFeeProxyAddress = async (
  contract: Contract,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  proxyType: 'native' | 'erc20',
  signer: Wallet,
  signWithEoa: boolean,
  version?: string,
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
    await executeContractMethod({
      network,
      contract,
      method: 'updateConversionProxyAddress',
      props: [proxyAddress],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `${proxyType} conversion proxy: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
  }
};

/**
 * Update the address of a proxy used by batch conversion contract.
 * @param contract BatchConversionPayments contract.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param proxyName The name of the fee proxy to update.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateBatchConversionProxy = async (
  contract: Contract,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  proxyName: string,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  let proxyAddress: string;
  let method: string;
  let currentAddress: string;
  switch (proxyName) {
    case 'native':
      proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network);
      method = 'setPaymentNativeProxy';
      currentAddress = await contract.paymentNativeProxy();
      break;
    case 'nativeConversion':
      proxyAddress = artifacts.ethConversionArtifact.getAddress(network);
      method = 'setPaymentNativeConversionProxy';
      currentAddress = await contract.paymentNativeConversionProxy();
      break;
    case 'erc20':
      proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
      method = 'setPaymentErc20Proxy';
      currentAddress = await contract.paymentErc20Proxy();
      break;
    case 'erc20Conversion':
      proxyAddress = artifacts.erc20ConversionProxy.getAddress(network);
      method = 'setPaymentErc20ConversionProxy';
      currentAddress = await contract.paymentErc20ConversionProxy();
      break;
    case 'chainlinkConversionPath':
      proxyAddress = artifacts.chainlinkConversionPath.getAddress(network);
      method = 'setChainlinkConversionPath';
      currentAddress = await contract.chainlinkConversionPath();
      break;
    default: {
      throw new Error(`${proxyName} not supported`);
    }
  }

  if (currentAddress.toLocaleLowerCase() !== proxyAddress.toLocaleLowerCase()) {
    await executeContractMethod({
      network,
      contract,
      method,
      props: [proxyAddress],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `${proxyName}: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
  }
};

/**
 * Update the native and the USD addresses used by batch conversion contract.
 * @param contract BatchConversionPayments contract.
 * @param NativeAddress The address of native token, eg: ETH.
 * @param USDAddress The address of USD token.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateNativeAndUSDAddress = async (
  contract: Contract,
  network: string,
  NativeAddress: string,
  USDAddress: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentUSDAddress = (await contract.USDAddress()).toLocaleLowerCase();
  const currentNativeAddress = (await contract.NativeAddress()).toLocaleLowerCase();
  if (
    currentNativeAddress !== NativeAddress.toLocaleLowerCase() ||
    currentUSDAddress !== USDAddress.toLocaleLowerCase()
  ) {
    await executeContractMethod({
      network,
      contract,
      method: 'setNativeAndUSDAddress',
      props: [NativeAddress, USDAddress],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `Batch: the current NativeAddress: ${currentNativeAddress}, have been replaced by: ${NativeAddress}`,
    );
    console.log(
      `Batch: the current USDAddress: ${currentUSDAddress}, have been replaced by: ${USDAddress}`,
    );
  }
};

/**
 * Update the native token hash used by a contract.
 * @param contractType name of the contract to be updated
 * @param contract contract to be updated.
 * @param network where the contract is deployed
 * @param nativeTokenHash The address of native token, eg: ETH.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EAO
 */
export const updateNativeTokenHash = async (
  contractType: string,
  contract: Contract,
  network: string,
  nativeTokenHash: string,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const currentNativeTokenHash = (await contract.nativeTokenHash()).toLocaleLowerCase();
  if (currentNativeTokenHash !== nativeTokenHash.toLocaleLowerCase()) {
    await executeContractMethod({
      network,
      contract,
      method: 'updateNativeTokenHash',
      props: [nativeTokenHash],
      txOverrides,
      signer,
      signWithEoa,
    });
    console.log(
      `${contractType}: the current NativeTokenHash: ${currentNativeTokenHash}, have been replaced by: ${nativeTokenHash}`,
    );
  }
};

/**
 * Gets the signer and gas fees information.
 * @param network The network used.
 * @param hre Hardhat runtime environment.
 * @returns An object:
 * - The signer
 * - txOverrides, with gas fee information
 */
export const getSignerAndGasFees = async (
  network: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<{
  signer: Wallet;
  txOverrides: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  };
}> => {
  let provider;
  if (network === 'celo') {
    provider = getCeloProvider();
  } else {
    provider = getDefaultProvider(network);
  }
  const signer = new hre.ethers.Wallet(hre.config.xdeploy.signer).connect(provider);

  const txOverrides = (await isEip1559Supported(provider))
    ? await normalizeGasFees({
        logger: console,
        suggestFees: suggestFeesEip1559(provider),
      })
    : {};

  return {
    signer,
    txOverrides,
  };
};

/**
 * Updates the ERC20 fee proxy address in the SingleRequestProxyFactory contract
 * @param contract SingleRequestProxyFactory contract
 * @param network The network used
 * @param txOverrides information related to gas fees
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EOA
 */
export const updateSRPFERC20FeeProxyAddress = async (
  contract: Contract,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const erc20ProxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
  const currentErc20Proxy = await contract.erc20FeeProxy();

  if (ethers.utils.getAddress(currentErc20Proxy) !== ethers.utils.getAddress(erc20ProxyAddress)) {
    await executeContractMethod({
      network,
      contract,
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
};

/**
 * Updates the Ethereum fee proxy address in the SingleRequestProxyFactory contract
 * @param contract SingleRequestProxyFactory contract
 * @param network The network used
 * @param txOverrides information related to gas fees
 * @param signer Who is performing the updating
 * @param signWithEoa Is the transaction to be signed by an EOA
 */
export const updateSRPFEthereumFeeProxyAddress = async (
  contract: Contract,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  signer: Wallet,
  signWithEoa: boolean,
): Promise<void> => {
  const ethereumProxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network);
  const currentEthereumProxy = await contract.ethereumFeeProxy();

  if (
    ethers.utils.getAddress(currentEthereumProxy) !== ethers.utils.getAddress(ethereumProxyAddress)
  ) {
    await executeContractMethod({
      network,
      contract,
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
};
