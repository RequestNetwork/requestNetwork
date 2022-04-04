export const getConstructorArgs = (contract: string) => {
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
        '0x0000000000000000000000000000000000000000',
        process.env.ADMIN_WALLET_ADDRESS,
      ];
    }
    default:
      return [];
  }
};
