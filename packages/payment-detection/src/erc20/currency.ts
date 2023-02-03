import {
  CurrencyDefinition,
  CurrencyManager,
  EVM,
  getCurrencyHash,
  StorageCurrency,
} from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { isAddress } from 'ethers/lib/utils';
import { getDefaultProvider } from '@requestnetwork/utils';
import { ERC20CurrencyInput } from '@requestnetwork/currency/src';

export const loadCurrencyFromContract = async (
  currency: StorageCurrency,
): Promise<CurrencyDefinition | null> => {
  try {
    const { network, value } = currency;

    if (!network || !isAddress(value)) {
      return null;
    }
    EVM.assertChainSupported(network);

    const contract = ERC20__factory.connect(value, getDefaultProvider(network));
    const decimals = await contract.decimals();

    if (!decimals) {
      return null;
    }

    const symbol = await contract.symbol();
    if (!symbol) {
      return null;
    }

    const definition: ERC20CurrencyInput = {
      address: value,
      decimals,
      symbol,
      network: network,
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
