import * as artifacts from '../src/lib';
import { CurrencyTypes } from '@requestnetwork/types';

const getEnvVariable = (name: string, contract: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} missing to get constructor args for: ${contract}`);
  }
  return value;
};

const getAdminWalletAddress = (contract: string): string => {
  return getEnvVariable('ADMIN_WALLET_ADDRESS', contract);
};

const getRecurringPaymentExecutorWalletAddress = (contract: string): string => {
  return getEnvVariable('RECURRING_PAYMENT_EXECUTOR_WALLET_ADDRESS', contract);
};

export const getConstructorArgs = (
  contract: string,
  network?: CurrencyTypes.EvmChainName,
): string[] => {
  switch (contract) {
    case 'ChainlinkConversionPath': {
      return ['0x0000000000000000000000000000000000000000', getAdminWalletAddress(contract)];
    }
    case 'Erc20ConversionProxy': {
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        getAdminWalletAddress(contract),
      ];
    }
    case 'EthConversionProxy': {
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        getAdminWalletAddress(contract),
      ];
    }
    case 'ERC20SwapToPay': {
      return ['0x0000000000000000000000000000000000000000', getAdminWalletAddress(contract)];
    }
    case 'ERC20SwapToConversion': {
      return [getAdminWalletAddress(contract)];
    }
    case 'ERC20EscrowToPay': {
      if (!network) {
        throw new Error(
          'Escrow contract requires network parameter to get correct address of erc20FeeProxy',
        );
      }
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
      return [erc20FeeProxyAddress, getAdminWalletAddress(contract)];
    }
    case 'BatchConversionPayments': {
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        getAdminWalletAddress(contract),
      ];
    }
    case 'ERC20TransferableReceivable': {
      if (!network) {
        throw new Error(
          'Receivable contract requires network parameter to get correct address of erc20FeeProxy',
        );
      }
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
      return ['Request Network Transferable Receivable', 'tREC', erc20FeeProxyAddress];
    }
    case 'SingleRequestProxyFactory': {
      if (!network) {
        throw new Error('SingleRequestProxyFactory requires network parameter');
      }
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
      const ethereumFeeProxy = artifacts.ethereumFeeProxyArtifact;
      const ethereumFeeProxyAddress = ethereumFeeProxy.getAddress(network);

      return [ethereumFeeProxyAddress, erc20FeeProxyAddress, getAdminWalletAddress(contract)];
    }
    case 'ERC20RecurringPaymentProxy': {
      if (!network) {
        throw new Error('ERC20RecurringPaymentProxy requires network parameter');
      }
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);

      const adminSafe = getAdminWalletAddress(contract);
      const executorEOA = getRecurringPaymentExecutorWalletAddress(contract);

      return [adminSafe, executorEOA, erc20FeeProxyAddress];
    }
    case 'ERC20CommerceEscrowWrapper': {
      if (!network) {
        throw new Error('ERC20CommerceEscrowWrapper requires network parameter');
      }
      // Constructor requires commerceEscrow address and erc20FeeProxy address
      // For now, using placeholder for commerceEscrow - this should be updated with actual deployed address
      const commerceEscrowAddress = '0x0000000000000000000000000000000000000000'; // TODO: Update with actual Commerce Payments escrow address
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);

      return [commerceEscrowAddress, erc20FeeProxyAddress];
    }
    default:
      return [];
  }
};
