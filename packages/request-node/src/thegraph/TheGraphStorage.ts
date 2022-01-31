import { EventEmitter } from 'events';
import { utils, Signer, ContractReceipt } from 'ethers';
import TypedEmitter from 'typed-emitter';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';

type TheGraphStorageProps = {
  network: string;
  signer: Signer;
  ipfsStorage: StorageTypes.IIpfsStorage;
  logger?: LogTypes.ILogger;
};

export type TheGraphStorageEventEmitter = TypedEmitter<{
  confirmed: (receipt: ContractReceipt) => void;
  error: (error: unknown) => void;
}>;

export class TheGraphStorage {
  private logger: LogTypes.ILogger;
  private ipfsStorage: StorageTypes.IIpfsStorage;
  private hashSubmitter: RequestOpenHashSubmitter;
  private network: string;

  constructor({ network, signer, ipfsStorage, logger }: TheGraphStorageProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.network = network;
    this.hashSubmitter = requestHashSubmitterArtifact.connect(
      network,
      signer,
    ) as RequestOpenHashSubmitter; // type mismatch with ethers.
  }

  async initialize(): Promise<void> {
    await this.ipfsStorage.initialize();
    this.logger.debug('TheGraph storage initialized');
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const fee = await this.hashSubmitter.getFeesAmount(ipfsSize);
    const tx = await this.hashSubmitter.submitHash(
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
      { value: fee },
    );

    const eventEmitter = new EventEmitter() as TheGraphStorageEventEmitter;
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
      .then((receipt) => {
        this.logger.debug(
          `TX ${receipt.transactionHash} confirmed at block ${receipt.blockNumber}`,
        );
        eventEmitter.emit('confirmed', receipt);
      })
      .catch((e) => eventEmitter.emit('error', e));

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
