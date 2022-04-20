import * as artifacts from '../src/lib';

export const getConstructorArgs = (contract: string, network?: string): string[] => {
  switch (contract) {
    case 'Erc20ConversionProxy': {
      if (!process.env.ADMIN_WALLET_ADDRESS) {
        throw new Error(`ADMIN_WALLET_ADDRESS missing to get constructor args for: ${contract}`);
      }
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        process.env.ADMIN_WALLET_ADDRESS,
      ];
    }
    case 'ERC20SwapToConversion': {
      if (!process.env.ADMIN_WALLET_ADDRESS) {
        throw new Error(`ADMIN_WALLET_ADDRESS missing to get constructor args for: ${contract}`);
      }
      return [process.env.ADMIN_WALLET_ADDRESS];
    }
    case 'ERC20EscrowToPay': {
      if (!process.env.ADMIN_WALLET_ADDRESS) {
        throw new Error(`ADMIN_WALLET_ADDRESS missing to get constructor args for: ${contract}`);
      }
      if (!network) {
        throw new Error(
          'Escrow contract requires network parameter to get correct address of erc20FeeProxy',
        );
      }
      const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
      const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
      return [erc20FeeProxyAddress, process.env.ADMIN_WALLET_ADDRESS];
    }
    default:
      return [];
  }
};
