export const getConstructorArgs = (contract: string) => {
  switch (contract) {
    case 'ERC20ConversionProxy': {
      if (!process.env.ADMIN_PRIVATE_KEY) {
        throw new Error(`ADMIN_PRIVATE_KEY missing to get constructor args for: ${contract}`);
      }
      return [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        process.env.ADMIN_PRIVATE_KEY,
      ];
    }
    default:
      return [];
  }
};
