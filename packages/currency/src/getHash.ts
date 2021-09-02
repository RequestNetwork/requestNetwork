import { RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

export const getHash = (curr: RequestLogicTypes.ICurrency): string => {
  return curr.type === RequestLogicTypes.CURRENCY.ERC20
    ? curr.value
    : Utils.crypto.last20bytesOfNormalizedKeccak256Hash({
        type: curr.type,
        value: curr.value,
        // FIXME network should be included for native tokens.
        // This implies an admin update on the conversion contract
        // Needs to be done before supporting ETH conversion on other chains than mainnet
        // network: 'network' in curr ? curr.network : undefined,
      });
};
