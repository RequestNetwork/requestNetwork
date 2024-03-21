import { ChainTypes, DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { SubgraphClient } from '@requestnetwork/thegraph-data-access';

/**
 * Class for storing confirmed transaction information
 * When 'confirmed' event is received from a 'persistTransaction', the event data is
 * stored and indexed by the storage subgraph. The client can call the
 * getConfirmedTransaction endpoint, to get the confirmed event.
 */
export default class ConfirmedTransactionStore {
  /**
   * Confirmed transactions store constructor
   */
  constructor(
    private readonly subgraphClient: SubgraphClient,
    private readonly storageChain: ChainTypes.IEvmChain,
  ) {}

  public async getConfirmedTransaction(
    transactionHash: string,
  ): Promise<DataAccessTypes.IReturnPersistTransactionRaw | undefined> {
    const { transactions, blockNumber } =
      await this.subgraphClient.getTransactionsByDataHash(transactionHash);
    if (transactions.length === 0) {
      return;
    }
    const transaction = transactions[0];
    return {
      meta: {
        transactionStorageLocation: transaction.hash,
        topics: transaction.topics,
        storageMeta: {
          state: StorageTypes.ContentState.CONFIRMED,
          storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
          timestamp: transaction.blockTimestamp,
          ethereum: {
            blockConfirmation: blockNumber - transaction.blockNumber,
            blockTimestamp: transaction.blockTimestamp,
            blockNumber: transaction.blockNumber,
            networkName: this.storageChain.name,
            smartContractAddress: transaction.smartContractAddress,
            transactionHash: transaction.transactionHash,
          },
          ipfs: {
            size: Number(transaction.size),
          },
        },
      },
      result: {},
    };
  }
}
