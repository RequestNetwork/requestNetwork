declare module 'wallet-address-validator' {
  function validate(address: string, currencyNameOrSymbol: string, networkType?: string): boolean;
}
