import { EventEmitter } from 'events';
import { providers } from 'ethers';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { getCurrentTimestampInSecond, SimpleLogger } from '@requestnetwork/utils';
import { getDefaultEthereumBlockConfirmations } from './config';

type StorageProps = {
  ipfsStorage: StorageTypes.IIpfsStorage;
  blockConfirmations?: number;
  txSubmitter: StorageTypes.ITransactionSubmitter;
  logger?: LogTypes.ILogger;
};

export class EthereumStorage implements StorageTypes.IStorageWrite {
  private readonly logger: LogTypes.ILogger;
  private readonly ipfsStorage: StorageTypes.IIpfsStorage;

  private readonly txSubmitter: StorageTypes.ITransactionSubmitter;
  private readonly blockConfirmations: number | undefined;

  constructor({ ipfsStorage, logger, blockConfirmations, txSubmitter }: StorageProps) {
    this.logger = logger || new SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.txSubmitter = txSubmitter;
    this.blockConfirmations = blockConfirmations;
  }

  async initialize(): Promise<void> {
    await this.ipfsStorage.initialize();
    await this.txSubmitter.initialize();
    this.logger.debug(`${EthereumStorage.name} storage initialized`);
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const tx = await this.txSubmitter.submit(ipfsHash, ipfsSize);

    const eventEmitter = new EventEmitter() as StorageTypes.AppendResultEmitter;
    const result: StorageTypes.IEntry = {
      id: ipfsHash,
      content,
      meta: {
        ipfs: { size: ipfsSize },
        local: { location: ipfsHash },
        ethereum: {
          nonce: tx.nonce,
          transactionHash: tx.hash,
          blockConfirmation: tx.confirmations,
          blockNumber: Number(tx.blockNumber),
          // wrong value, but this metadata will not be used, as it's in Pending state
          blockTimestamp: -1,
          networkName: this.txSubmitter.network || '',
          smartContractAddress: this.txSubmitter.hashSubmitterAddress || '',
        },
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp: getCurrentTimestampInSecond(),
      },
    };

    this.logger.debug(`TX ${tx.hash} submitted, waiting for confirmation...`);

    void tx
      .wait(this.blockConfirmations || getDefaultEthereumBlockConfirmations())
      .then((receipt: providers.TransactionReceipt) => {
        this.logger.debug(
          `TX ${receipt.transactionHash} confirmed at block ${receipt.blockNumber}`,
        );
        eventEmitter.emit('confirmed', result);
      })
      .catch((e: Error) => eventEmitter.emit('error', e));

    return Object.assign(eventEmitter, result);
  }

  public async _getStatus(): Promise<unknown> {
    const ipfs = await this.ipfsStorage.getConfig();

    return {
      ethereum: {
        networkName: this.txSubmitter.network,
        hashSubmitterAddress: this.txSubmitter.hashSubmitterAddress,
        creationBlockNumberHashStorage: this.txSubmitter.creationBlockNumber,
      },
      ipfs,
    };
  }
}
