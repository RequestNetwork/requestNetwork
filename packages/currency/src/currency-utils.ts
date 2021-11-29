/**
 * Checks if a Near address is valid according to a currency network.
 * Returns true if the currency network is not given and the address is correct for any network.
 */
export const isValidNearAddress = (address: string, network?: string): boolean => {
  if (!network) {
    return isValidNearAddress(address, 'aurora') || isValidNearAddress(address, 'aurora-testnet');
  }
  // see link bellow for NEAR address specification
  // https://nomicon.io/DataStructures/Account.html
  if (address.length < 2 || address.length > 64) {
    return false;
  }
  if (!address.match(/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/)) {
    return false;
  }
  // see link bellow for details about top level accounts on mainnet and testnet
  // https://docs.near.org/docs/videos/accounts-keys
  switch (network) {
    case 'aurora':
      return !!address.match(/\.near$/);
    case 'aurora-testnet':
      return !!address.match(/\.testnet$/);
    default:
      throw new Error(`Cannot validate NEAR address for network ${network}`);
  }
};
