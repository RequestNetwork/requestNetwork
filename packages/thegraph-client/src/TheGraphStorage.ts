import { EventEmitter } from 'events';
import * as IPFS from 'ipfs-http-client';
import { utils, Signer } from 'ethers';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';

type TheGraphStorageProps = {
  network: string;
  signer: Signer;
  ipfs: IPFS.Options;
  logger?: LogTypes.ILogger;
};

export class TheGraphStorage {
  private ipfs: IPFS.IPFSHTTPClient;
  private hashSubmitter: RequestOpenHashSubmitter;
  private logger: LogTypes.ILogger;

  constructor({ network, signer, ipfs, logger }: TheGraphStorageProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfs = IPFS.create(ipfs);

    this.hashSubmitter = requestHashSubmitterArtifact.connect(network, signer as any) as any; // TODO fix ethers
  }

  async initialize(): Promise<void> {
    await Utils.retry(this.ipfs.config.getAll, {
      maxRetries: 5,
      retryDelay: 1000,
    })();
    this.logger.debug('TheGraph storage initialized');
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const doc = await this.ipfs.add(content);

    const fee = await this.hashSubmitter.getFeesAmount(doc.size);
    const tx = await this.hashSubmitter.submitHash(
      doc.path,
      utils.hexZeroPad(utils.hexlify(doc.size), 32),
      { value: fee },
    );

    const eventEmitter = new EventEmitter();

    this.logger.debug(`TX ${tx.hash} submitted, waiting for confirmation...`);

    // TODO pass tx information
    void tx.wait().then((receipt) => {
      this.logger.debug(`TX ${receipt.transactionHash} confirmed at block ${receipt.blockNumber}`);
      eventEmitter.emit('confirmed');
    });

    // TODO pass tx hash
    return Object.assign(eventEmitter, {
      id: doc.path,
      content,
      meta: {
        ipfs: { size: doc.size },
        local: { location: doc.path },
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
    });
  }
}
