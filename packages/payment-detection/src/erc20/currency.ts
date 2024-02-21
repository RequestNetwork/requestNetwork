import {
  CurrencyDefinition,
  CurrencyManager,
  ERC20Currency,
  getCurrencyHash,
  StorageCurrency,
} from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { isAddress } from 'ethers/lib/utils';
import { getDefaultProvider } from '@requestnetwork/utils';
import { CurrencyInput, ERC20CurrencyInput } from '@requestnetwork/currency/src';
import { ChainManager } from '@requestnetwork/chain/src';

export const loadCurrencyFromContract = async (
  currency: StorageCurrency,
): Promise<CurrencyDefinition | null> => {
  try {
    const { network, value } = currency;

    if (!network || !isAddress(value)) {
      return null;
    }

    const contract = ERC20__factory.connect(value, getDefaultProvider(network));
    const decimals = await contract.decimals();

    if (!decimals) {
      return null;
    }

    const symbol = await contract.symbol();
    if (!symbol) {
      return null;
    }

    const definition = {
      address: value,
      decimals,
      symbol,
      network: ChainManager.current().fromName(
        network,
        ChainManager.current().getEcosystemsByCurrencyType(RequestLogicTypes.CURRENCY.ERC20),
      ),
      type: RequestLogicTypes.CURRENCY.ERC20,
    } as ERC20Currency;

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
