import * as artifacts from '../src/lib';

const getAdminWalletAddress = (contract: string): string => {
  if (!process.env.ADMIN_WALLET_ADDRESS) {
    throw new Error(`ADMIN_WALLET_ADDRESS missing to get constructor args for: ${contract}`);
  }
  return process.env.ADMIN_WALLET_ADDRESS;
};

export const getConstructorArgs = (contract: string, network?: string): string[] => {
  switch (contract) {
    case 'Erc20ConversionProxy': {
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        getAdminWalletAddress(contract),
      ];
    }
    case 'ETHConversionProxy': {
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        // FIXME: This is not right the NativeTokenHash is not the same accross all networks
        //        It should be set to 0x0, and then updated through setup functions
        //        These functions needs to be implemented in the contract before it can deployed using xdeployer
        '0x39e19aa5b69466dfdc313c7cda37cb2a599015cd',
      ];
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
      if (!network) {
        throw new Error(
          'Batch conversion contract requires network parameter to get correct address of erc20FeeProxy, erc20ConversionFeeProxy, ethereumFeeProxy, ethereumConversionFeeProxy, and chainlinkConversionPath',
        );
      }
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        getAdminWalletAddress(contract),
      ];
    }
    default:
      return [];
  }
};
