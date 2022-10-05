import { EventEmitter } from 'events';
import { BigNumber, ContractReceipt, PayableOverrides, providers, Signer, utils } from 'ethers';
import TypedEmitter from 'typed-emitter';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';

type StorageProps = {
  network: string;
  signer: Signer;
  ipfsStorage: StorageTypes.IIpfsStorage;
  logger?: LogTypes.ILogger;
};

export type StorageEventEmitter = TypedEmitter<{
  confirmed: (receipt: ContractReceipt) => void;
  error: (error: unknown) => void;
}>;

export class EthereumStorageEthers implements StorageTypes.IStorageWrite {
  private readonly logger: LogTypes.ILogger;
  private readonly ipfsStorage: StorageTypes.IIpfsStorage;
  private readonly hashSubmitter: RequestOpenHashSubmitter;
  private readonly network: string;
  private readonly provider: providers.JsonRpcProvider;
  private enableEip1559 = true;

  constructor({ network, signer, ipfsStorage, logger }: StorageProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.network = network;
    this.provider = signer.provider as providers.JsonRpcProvider;
    this.hashSubmitter = requestHashSubmitterArtifact.connect(
      network,
      signer,
    ) as RequestOpenHashSubmitter; // type mismatch with ethers.
  }

  async initialize(): Promise<void> {
    await this.ipfsStorage.initialize();
    try {
      await this.provider.send('eth_feeHistory', [1, 'latest', []]);
    } catch (e) {
      this.logger.warn(
        'This RPC provider does not support the "eth_feeHistory" method: switching to legacy gas price',
      );
      this.enableEip1559 = false;
    }
    this.logger.debug(`${EthereumStorageEthers.name} storage initialized`);
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const fee = await this.hashSubmitter.getFeesAmount(ipfsSize);
    const overrides: PayableOverrides = { value: fee };
    if (this.enableEip1559) {
      const suggestedFee = await suggestFees(
        this.hashSubmitter.provider as providers.JsonRpcProvider,
      );
      const maxPriorityFeePerGas = BigNumber.from(suggestedFee.maxPriorityFeeSuggestions.urgent);
      const maxFeePerGas = maxPriorityFeePerGas.add(suggestedFee.baseFeeSuggestion);
      overrides.maxPriorityFeePerGas = maxPriorityFeePerGas;
      overrides.maxFeePerGas = maxFeePerGas;
    }
    const tx = await this.hashSubmitter.submitHash(
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
      overrides,
    );

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
