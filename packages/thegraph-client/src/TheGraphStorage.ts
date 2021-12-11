import { EventEmitter } from 'events';
import * as IPFS from 'ipfs-http-client';
import { utils, Signer } from 'ethers';
import Utils from '@requestnetwork/utils';
import { StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';

export class TheGraphStorage {
  private ipfs: IPFS.IPFSHTTPClient;
  private hashSubmitter: RequestOpenHashSubmitter;

  constructor(network: string, signer: Signer, ipfs: IPFS.Options) {
    this.ipfs = IPFS.create(ipfs);

    this.hashSubmitter = requestHashSubmitterArtifact.connect(network, signer as any) as any; // TODO fix ethers
  }

  async initialize() {
    await Utils.retry(this.ipfs.config.getAll, {
      maxRetries: 5,
      retryDelay: 1000,
    })();
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

    // TODO pass tx information
    tx.wait().then(() => eventEmitter.emit('confirmed'));

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
