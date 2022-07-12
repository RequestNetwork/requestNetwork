import { HardhatRuntimeEnvironmentExtended } from '../types';
import { erc20SwapConversionArtifact } from '../../src/lib';
import { batchPaymentsArtifact } from '../../src/lib';
import utils from '@requestnetwork/utils';
import {
  updateBatchPaymentFees,
  updatePaymentErc20FeeProxy,
  updatePaymentEthFeeProxy,
  updateChainlinkConversionPath,
  updateRequestSwapFees,
  updateSwapRouter,
} from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
 * @param hre Hardhat runtime environment
 */
const setupBatchPayments = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const batchPaymentContract = new hre.ethers.Contract(
    contractAddress,
    batchPaymentsArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const batchPaymentConnected = await batchPaymentContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      // start from the adminNonce, increase gasPrice if needed
      await Promise.all([
        updateBatchPaymentFees(batchPaymentConnected, adminNonce, gasPrice),
        updatePaymentErc20FeeProxy(batchPaymentConnected, network, adminNonce + 1, gasPrice),
        updatePaymentEthFeeProxy(batchPaymentConnected, network, adminNonce + 2, gasPrice),
      ]);
    }),
  );
  console.log('Setup for setupBatchPayment successfull');
};

/**
 * Updates the values of the chainlinkConversionPath and swap router of the ERC20SwapToConversion contract, if needed
 * @param contractAddress address of the ERC20SwapToConversion Proxy
 * @param hre Hardhat runtime environment
 */
const setupERC20SwapToConversion = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const ERC20SwapToConversionContract = new hre.ethers.Contract(
    contractAddress,
    erc20SwapConversionArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const ERC20SwapToConversionConnected = await ERC20SwapToConversionContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      await Promise.all([
        updateChainlinkConversionPath(
          ERC20SwapToConversionConnected,
          network,
          adminNonce,
          gasPrice,
        ),
        updateSwapRouter(ERC20SwapToConversionConnected, network, adminNonce + 1, gasPrice),
        updateRequestSwapFees(ERC20SwapToConversionConnected, adminNonce + 2, gasPrice),
      ]);
    }),
  );
  console.log('Setup for ERC20SwapToConversion successfull');
};

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
 * @param hre Hardhat runtime environment
 */
const setupEthConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const EthConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    batchPaymentsArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const EthConversionProxyConnected = await EthConversionProxyContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      // start from the adminNonce, increase gasPrice if needed
      await Promise.all([
        updatePaymentErc20FeeProxy(EthConversionProxyConnected, network, adminNonce, gasPrice),
        updateChainlinkConversionPath(EthConversionProxyConnected, network, adminNonce+1, gasPrice),
      ]);
    }),
  );
  console.log('Setup for EthConversionProxy successful');
};

export const setupContract = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
  contractName: string,
): Promise<void> => {
  switch (contractName) {
    case 'EthConversionProxy': {
      await setupEthConversionProxy(contractAddress, hre);
      break;
    }
    case 'ERC20SwapToConversion': {
      await setupERC20SwapToConversion(contractAddress, hre);
      break;
    }
    case 'BatchPayments': {
      await setupBatchPayments(contractAddress, hre);
      break;
    }
    default: {
      console.log('Contract name not found');
      break;
    }
  }
};
