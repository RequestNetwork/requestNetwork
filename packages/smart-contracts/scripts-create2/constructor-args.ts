import * as artifacts from '../src/lib';

export const getConstructorArgs = (contract: string, network?: string) => {
  const requestFeesCollector = '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7';
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
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        process.env.ADMIN_WALLET_ADDRESS,
        requestFeesCollector,
        '5',
      ];
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
