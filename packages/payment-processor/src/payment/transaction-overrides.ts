import { providers } from 'ethers';

/** Custom values to pass to transaction */
export interface ITransactionOverrides
  extends Omit<providers.TransactionRequest, 'to' | 'data' | 'value'> {}
