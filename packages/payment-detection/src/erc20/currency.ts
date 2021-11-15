import { utils } from 'ethers';
import {
  CurrencyDefinition,
  CurrencyManager,
  getCurrencyHash,
  StorageCurrency,
} from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { getDefaultProvider } from '../provider';

export const loadCurrencyFromContract = async (
  currency: StorageCurrency,
): Promise<CurrencyDefinition | null> => {
  if (!currency.network || !utils.isAddress(currency.value)) {
    return null;
  }

  try {
    const contract = ERC20__factory.connect(currency.value, getDefaultProvider(currency.network));
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
