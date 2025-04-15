import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import { EthereumStorage, ThirdwebTransactionSubmitter } from '@requestnetwork/ethereum-storage';
import { PendingStore } from '@requestnetwork/data-access';
import { CurrencyTypes, LogTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config';

/**
 * Creates and returns a data access instance
 * @param network The Ethereum network to use
 * @param ipfsStorage The IPFS storage instance
 * @param logger Logger instance
 * @param graphNodeUrl Graph Node endpoint URL
 * @param blockConfirmations Number of block confirmations to wait for
 * @returns A data access instance
 */
export async function getDataAccess(
  network: CurrencyTypes.EvmChainName,
  ipfsStorage: StorageTypes.IIpfsStorage,
  logger: LogTypes.ILogger,
  graphNodeUrl: string,
  blockConfirmations: number,
): Promise<TheGraphDataAccess> {
  // Validate that all required Thirdweb config options are set
  config.validateThirdwebConfig();

  logger.info('Using Thirdweb Engine for transaction submission');

  // Create ThirdwebTransactionSubmitter
  const txSubmitter = new ThirdwebTransactionSubmitter({
    engineUrl: config.getThirdwebEngineUrl(),
    accessToken: config.getThirdwebAccessToken(),
    backendWalletAddress: config.getThirdwebBackendWalletAddress(),
    network,
    logger,
  });

  // Initialize the transaction submitter
  await txSubmitter.initialize();

  // Create Ethereum Storage with the transaction submitter
  const storage = new EthereumStorage({
    ipfsStorage,
    txSubmitter,
    blockConfirmations,
    logger,
  });

  // Create and return TheGraphDataAccess
  return new TheGraphDataAccess({
    graphql: { url: graphNodeUrl },
    storage,
    network,
    logger,
    pendingStore: new PendingStore(),
  });
}
