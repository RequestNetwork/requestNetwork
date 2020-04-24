import * as Bluebird from 'bluebird';

import { LogTypes, StorageTypes } from '@requestnetwork/types';
import {
  getMaxIpfsReadRetry,
} from './config';

import IgnoredDataIds from './ignored-dataIds';
import IpfsConnectionError from './ipfs-connection-error';
import IpfsManager from './ipfs-manager';

// rate of the size of the Header of a ipfs file regarding its content size
// used to estimate the size of a ipfs file from the content size
const SAFE_RATE_HEADER_SIZE: number = 0.3;
// max ipfs header size
const SAFE_MAX_HEADER_SIZE: number = 500;

/**
 * Verify the hashes are present on IPFS for the corresponding ethereum entry
 * Filtered incorrect hashes
 * @param ethereumEntries Ethereum entries from the smart contract
 * @returns Filtered list of dataId with metadata
 */
export default async function EthereumEntriesToIpfsContent(
    ethereumEntries: StorageTypes.IEthereumEntry[],
    ipfsManager: IpfsManager,
    ignoredDataIdsIndex: IgnoredDataIds,
    logger: LogTypes.ILogger,
    maxConcurrency: number,
  ): Promise<StorageTypes.IEntry[]> {
  const totalCount: number = ethereumEntries.length;
  let successCount: number = 0;
  let successCountOnFirstTry: number = 0;
  let ipfsConnectionErrorCount: number = 0;
  let wrongFeesCount: number = 0;
  let incorrectFileCount: number = 0;

  // Contains results from readHashOnIPFS function
  // We store hashAndSize in this array in order to know which hashes have not been found on IPFS
  let allIpfsContentOrErrors: Array<{
    ipfsContent: StorageTypes.IEntry | null;
    entryWithError: StorageTypes.IEthereumEntry | null;
  }>;

  // Final array of dataIds, content and meta
  const finalIpfsContents: StorageTypes.IEntry[] = [];
  let ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = ethereumEntries.slice();

  // Try to read the hashes on IPFS
  // The operation is done at least once and retried depending on the readOnIPFSRetry config
  for (let tryIndex = 0; tryIndex < 1 + getMaxIpfsReadRetry(); tryIndex++) {
    // Reset for each retry
    ipfsConnectionErrorCount = 0;

    if (tryIndex > 0) {
      logger.debug(`Retrying to read hashes on IPFS`, ['ipfs']);
    }

    allIpfsContentOrErrors = await Bluebird.map(
      ethereumEntriesToProcess,
      // Read hash on IPFS and retrieve content corresponding to the hash
      // Reject on error when no file is found on IPFS
      // or when the declared size doesn't correspond to the size of the content stored on ipfs
      async (ethereumEntry: StorageTypes.IEthereumEntry) => {
        return getIpfsContent(ethereumEntry, tryIndex + 1, ipfsManager, logger);
      },
      {
        concurrency: maxConcurrency,
      },
    );

    // flush the list of entries to process
    ethereumEntriesToProcess = [];

    // Store found hashes in entries
    // The hashes to retry to read are the hashes where readHashOnIPFS returned null
    for (const { ipfsContent, entryWithError } of allIpfsContentOrErrors) {
      if (ipfsContent) {
        // content found and not error
        finalIpfsContents.push(ipfsContent);
      } else if (entryWithError) {
        const errorType = entryWithError.error!.type;
        if (errorType === StorageTypes.ErrorEntries.INCORRECT_FILE) {
          incorrectFileCount++;
          // no retry needed, just store it
          await ignoredDataIdsIndex.save(entryWithError);
        } else if (errorType === StorageTypes.ErrorEntries.WRONG_FEES) {
          wrongFeesCount++;
          // no retry needed, just store it
          await ignoredDataIdsIndex.save(entryWithError);
        } else if (errorType === StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR) {
          ipfsConnectionErrorCount++;
          // push it for a retry
          ethereumEntriesToProcess.push(entryWithError);
        } else {
          throw new Error(`Unexpected Error for the hash: ${entryWithError.hash}, ${entryWithError.error?.type}, ${entryWithError.error?.message}`);
        }
      }
    }

    successCount = finalIpfsContents.length;

    logger.debug(`${successCount}/${totalCount} retrieved dataIds after try ${tryIndex + 1}`, ['ipfs']);

    if (tryIndex === 0) {
      successCountOnFirstTry = successCount;
    }
  }

  // Save the entries not successfully retrieved after the retries
  for (const remainingEntry of ethereumEntriesToProcess) {
    // store the ipfs ignored after the retried
    await ignoredDataIdsIndex.save(remainingEntry);
  }

  // Clean the ignored dataIds
  for (const ipfsContent of finalIpfsContents) {
    // store the id successfully retrieved from the ignored ones
    await ignoredDataIdsIndex.delete(ipfsContent.id);
  }

  logger.info(
    `getData on ${totalCount} events, ${successCount} retrieved (${successCount -
      successCountOnFirstTry} after retries), ${ipfsConnectionErrorCount} not found, ${incorrectFileCount} incorrect files, ${wrongFeesCount} with wrong fees`,
    ['metric', 'successfullyRetrieved'],
  );

  return finalIpfsContents;
}

/**
 * Tries to get the ipfs content or return the error
 * @param ethereumEntry entry information to get the ipfs from
 * @returns the ipfsContent and meta or the entry with the error
 */
async function getIpfsContent(
  ethereumEntry: StorageTypes.IEthereumEntry,
  tryIndex: number,
  ipfsManager: IpfsManager,
  logger: LogTypes.ILogger,
): Promise<{
  ipfsContent: StorageTypes.IEntry | null;
  entryWithError: StorageTypes.IEthereumEntry | null;
}> {
  // Check if the event log is incorrect
  if (
    typeof ethereumEntry.hash === 'undefined' ||
    typeof ethereumEntry.feesParameters === 'undefined'
  ) {
    throw Error('The event log has no hash or feesParameters');
  }
  if (typeof ethereumEntry.meta === 'undefined') {
    throw Error('The event log has no metadata');
  }

  // Get content from ipfs and verify provided size is correct
  let ipfsObject;

  // To limit the read response size, calculate a reasonable margin for the IPFS headers compared to the size stored on ethereum
  const ipfsHeaderMargin = Math.max(
    ethereumEntry.feesParameters.contentSize * SAFE_RATE_HEADER_SIZE,
    SAFE_MAX_HEADER_SIZE,
  );

  try {
    const startTime = Date.now();
    // Send ipfs request
    ipfsObject = await ipfsManager.read(
      ethereumEntry.hash,
      Number(ethereumEntry.feesParameters.contentSize) + ipfsHeaderMargin,
    );
    logger.debug(
      `read ${ethereumEntry.hash}, try; ${tryIndex}. Took ${Date.now() - startTime} ms`,
      ['ipfs'],
    );
  } catch (error) {
    const errorMessage = error.message || error;

    // Check the type of the error
    if (error instanceof IpfsConnectionError) {
      logger.info(`IPFS connection error when trying to fetch: ${ethereumEntry.hash}`, [
        'ipfs',
      ]);
      logger.debug(`IPFS connection error : ${errorMessage}`, ['ipfs']);
      // An ipfs connection error occurred (for example a timeout), therefore we would eventually retry to find the has
      return {
        entryWithError: {
          ...ethereumEntry,
          error: { message: errorMessage, type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR },
        },
        ipfsContent: null,
      };
    } else {
      logger.info(`Incorrect file for hash: ${ethereumEntry.hash}`, ['ipfs']);

      // No need to retry to find this hash
      return {
        entryWithError: {
          ...ethereumEntry,
          error: { message: errorMessage, type: StorageTypes.ErrorEntries.INCORRECT_FILE },
        },
        ipfsContent: null,
      };
    }
  }

  const contentSizeDeclared = ethereumEntry.feesParameters.contentSize;

  // Check if the declared size is higher or equal to the size of the actual file
  // If the declared size is higher, it's not considered as a problem since it means the hash submitter has paid a bigger fee than he had to
  if (!ipfsObject || ipfsObject.ipfsSize > contentSizeDeclared) {
    logger.info(`Incorrect declared size for hash: ${ethereumEntry.hash}`, ['ipfs']);

    // No need to retry to find this hash
    return {
      entryWithError: {
        ...ethereumEntry,
        error: { message: `Incorrect declared size`, type: StorageTypes.ErrorEntries.WRONG_FEES },
      },
      ipfsContent: null,
    };
  }

  // Get meta data from ethereum
  const ethereumMetadata = ethereumEntry.meta;

  const ipfsContent = {
    content: ipfsObject.content,
    id: ethereumEntry.hash,
    meta: {
      ethereum: ethereumMetadata,
      ipfs: { size: ipfsObject.ipfsSize },
      state: StorageTypes.ContentState.CONFIRMED,
      storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      timestamp: ethereumMetadata.blockTimestamp,
    },
  };
  return { ipfsContent, entryWithError: null };
}
