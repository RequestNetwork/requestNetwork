import { providers } from 'ethers';

/** Custom values to pass to transaction */
export type ITransactionOverrides = Omit<providers.TransactionRequest, 'to' | 'data' | 'value'>;
