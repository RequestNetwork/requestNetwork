import { EventEmitter } from 'events';
import { BigNumber, ContractReceipt, PayableOverrides, providers, Signer, utils } from 'ethers';
import TypedEmitter from 'typed-emitter';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import { GasPriceDefiner } from '@requestnetwork/ethereum-storage';
import assert from 'assert';

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
  private readonly logger: LogTypes.ILogger;
  private readonly ipfsStorage: StorageTypes.IIpfsStorage;
  private readonly hashSubmitter: RequestOpenHashSubmitter;
  private readonly network: string;
  private readonly provider: providers.JsonRpcProvider;
  private enableEip1559 = true;

  constructor({ network, signer, ipfsStorage, logger }: TheGraphStorageProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.network = network;
    assert(
      signer.provider instanceof providers.JsonRpcProvider,
      'TheGraphStorage provider must be a JsonRpcProvider',
    );
    this.provider = signer.provider;
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
    this.logger.debug('TheGraph storage initialized');
  }

  async append(content: string): Promise<StorageTypes.IAppendResult> {
    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const fee = await this.hashSubmitter.getFeesAmount(ipfsSize);
    const overrides: PayableOverrides = { value: fee };
    if (this.enableEip1559) {
      const suggestedFee = await suggestFees(
        this.hashSubmitter.provider as providers.JsonRpcProvider,
      );
      overrides.maxFeePerGas = BigNumber.from(suggestedFee.baseFeeSuggestion);
      overrides.maxPriorityFeePerGas = BigNumber.from(
        suggestedFee.maxPriorityFeeSuggestions.urgent,
      );
    } else {
      // retro-compatibility for networks where the eth_feeHistory RPC method is not available (pre EIP-1559)
      const gasPriceDefiner = new GasPriceDefiner();
      overrides.gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.FAST,
        this.network,
      );
    }
    const tx = await this.hashSubmitter.submitHash(
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
      overrides,
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
