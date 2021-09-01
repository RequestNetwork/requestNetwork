import {
  CurrencyDefinition,
  CurrencyManager,
  getCurrencyHash,
  StorageCurrency,
} from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { Contract, providers, utils } from 'ethers';
import { getDefaultProvider } from '../provider';

// TODO - remove this when https://github.com/RequestNetwork/requestNetwork/pull/569 is merged (it fixes the ABI of ERC20 contract)
class TokenContract extends Contract {
  constructor(address: string, signer?: providers.Provider) {
    super(
      address,
      ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'],
      signer,
    );
  }
  decimals(): Promise<number> {
    return this.functions.decimals();
  }
  symbol(): Promise<string> {
    return this.functions.symbol();
  }
}

// TODO test
export const loadCurrencyFromContract = async (
  currency: StorageCurrency,
): Promise<CurrencyDefinition | null> => {
  if (!currency.network || !utils.isAddress(currency.value)) {
    return null;
  }

  try {
    const contract = new TokenContract(currency.value, getDefaultProvider(currency.network));
    const decimals = await contract.decimals();

    if (!decimals) {
      return null;
    }
    const symbol = await contract.symbol();
    if (!symbol) {
      return null;
    }
    const definition = {
      address: currency.value,
      decimals,
      symbol,
      network: currency.network,
      type: RequestLogicTypes.CURRENCY.ERC20,
    };
    return {
      ...definition,
      id: CurrencyManager.currencyId(definition),
      hash: getCurrencyHash(CurrencyManager.toStorageCurrency(definition)),
      meta: null as never,
    };
  } catch (e) {
    return null;
  }
};
