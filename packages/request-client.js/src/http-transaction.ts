import { HttpDataAccessConfig } from './http-data-access-config';
import { DataAccessTypes } from '@requestnetwork/types';
import { normalizeKeccak256Hash } from '@requestnetwork/utils';

export class HttpTransaction {
  constructor(private readonly dataAccessConfig: HttpDataAccessConfig) {}

  /**
   * Gets a transaction from the node through HTTP.
   * @param transactionData The transaction data
   */
  public async getConfirmedTransaction(
    transactionData: DataAccessTypes.ITransaction,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const transactionHash: string = normalizeKeccak256Hash(transactionData).value;

    return await this.dataAccessConfig.fetchAndRetry(
      '/getConfirmedTransaction',
      {
        transactionHash,
      },
      {
        maxRetries: this.dataAccessConfig.httpConfig.getConfirmationMaxRetry,
        retryDelay: this.dataAccessConfig.httpConfig.getConfirmationRetryDelay,
        exponentialBackoffDelay:
          this.dataAccessConfig.httpConfig.getConfirmationExponentialBackoffDelay,
        maxExponentialBackoffDelay:
          this.dataAccessConfig.httpConfig.getConfirmationMaxExponentialBackoffDelay,
      },
    );
  }
}
