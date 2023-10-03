import { suggestFees } from '@rainbow-me/fee-suggestions';
import { FeeTypes } from '@requestnetwork/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const suggestFeesEip1559 = (provider: any) => {
  return async (): Promise<FeeTypes.SuggestedFees> => {
    const { baseFeeSuggestion, maxPriorityFeeSuggestions } = await suggestFees(provider);
    return {
      baseFee: baseFeeSuggestion,
      maxPriorityFee: maxPriorityFeeSuggestions.urgent,
    };
  };
};
