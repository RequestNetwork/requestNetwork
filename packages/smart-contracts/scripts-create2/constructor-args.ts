import * as artifacts from '../src/lib';
import { CurrencyTypes } from '@requestnetwork/types';

const getAdminWalletAddress = (contract: string): string => {
  if (!process.env.ADMIN_WALLET_ADDRESS) {
    throw new Error(`ADMIN_WALLET_ADDRESS missing to get constructor args for: ${contract}`);
  }
  return process.env.ADMIN_WALLET_ADDRESS;
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
    default:
      return [];
  }
};
