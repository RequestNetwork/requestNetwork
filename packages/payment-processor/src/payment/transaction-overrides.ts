import { TransactionRequest } from 'ethers/providers';

/** Custom values to pass to transaction */
export interface ITransactionOverrides extends Omit<TransactionRequest, 'to' | 'data' | 'value'> {}
