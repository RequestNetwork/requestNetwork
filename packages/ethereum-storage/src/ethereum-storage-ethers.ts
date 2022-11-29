import { EventEmitter } from 'events';
import { BigNumber, ContractReceipt, providers, Signer } from 'ethers';
import TypedEmitter from 'typed-emitter';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { EthereumTransactionSubmitter } from './ethereum-tx-submitter';

export type GasDefinerProps = {
  gasPriceMin?: BigNumber;
};

export type SubmitterProps = GasDefinerProps & {
  network: string;
  signer: Signer;
  logger?: LogTypes.ILogger;
};

type StorageProps = SubmitterProps & {
  ipfsStorage: StorageTypes.IIpfsStorage;
};

export type StorageEventEmitter = TypedEmitter<{
  confirmed: (receipt: ContractReceipt) => void;
  error: (error: unknown) => void;
}>;

export class EthereumStorageEthers implements StorageTypes.IStorageWrite {
  private readonly logger: LogTypes.ILogger;
  private readonly ipfsStorage: StorageTypes.IIpfsStorage;

  private readonly network: string;
  private readonly txSubmitter: EthereumTransactionSubmitter;

  constructor({ network, signer, ipfsStorage, logger, gasPriceMin }: StorageProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.network = network;
    this.txSubmitter = new EthereumTransactionSubmitter({ network, signer, logger, gasPriceMin });
  }

  async initialize(): Promise<void> {
    await this.ipfsStorage.initialize();
    await this.txSubmitter.initialize();
    this.logger.debug(`${EthereumStorageEthers.name} storage initialized`);
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const tx = await this.txSubmitter.submit(ipfsHash, ipfsSize);

    const eventEmitter = new EventEmitter() as StorageEventEmitter;
    const result: StorageTypes.IEntry = {
      id: ipfsHash,
      content,
      meta: {
        ipfs: { size: ipfsSize },
        local: { location: ipfsHash },
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
    };

    this.logger.debug(`TX ${tx.hash} submitted, waiting for confirmation...`);

    void tx
      .wait()
      .then((receipt: providers.TransactionReceipt) => {
        this.logger.debug(
          `TX ${receipt.transactionHash} confirmed at block ${receipt.blockNumber}`,
        );
        eventEmitter.emit('confirmed', receipt);
      })
      .catch((e: Error) => eventEmitter.emit('error', e));

    return Object.assign(eventEmitter, result);
  }

  public async _getStatus(): Promise<unknown> {
    const ipfs = await this.ipfsStorage.getConfig();
    const { address, creationBlockNumber } = requestHashSubmitterArtifact.getDeploymentInformation(
      this.network,
    );

    return {
      ethereum: {
        networkName: this.network,
        hashSubmitterAddress: address,
        creationBlockNumberHashStorage: creationBlockNumber,
      },
      ipfs,
    };
  }
}
