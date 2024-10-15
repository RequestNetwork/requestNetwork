import { BigNumber, ContractTransaction, providers, Signer, utils } from 'ethers';
import { CurrencyTypes, LogTypes, StorageTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';
import { GasFeeDefiner } from './gas-fee-definer';
import { SimpleLogger, isEip1559Supported } from '@requestnetwork/utils';

export type SubmitterProps = {
  signer: Signer;
  /**
   * The minimum value for maxPriorityFeePerGas and maxFeePerGas.
   * The default is zero.
   */
  gasPriceMin?: BigNumber;
  /**
   * The maximum value for maxFeePerGas.
   * There is no limit if no value is set.
   */
  gasPriceMax?: BigNumber;
  /**
   * A multiplier for the computed maxFeePerGas.
   * The default is 100, which does not change the value (100 is equal to x1, 200 is equal to x2).
   */
  gasPriceMultiplier?: number;
  network: CurrencyTypes.EvmChainName;
  logger?: LogTypes.ILogger;
  debugProvider?: boolean;
};

/**
 * Handles the submission of a hash on the request HashSubmitter contract
 */
export class EthereumTransactionSubmitter implements StorageTypes.ITransactionSubmitter {
  private readonly logger: LogTypes.ILogger;
  private enableEip1559 = true;
  private readonly hashSubmitter: RequestOpenHashSubmitter;
  private readonly provider: providers.JsonRpcProvider;
  private readonly gasFeeDefiner: GasFeeDefiner;

  constructor({
    network,
    signer,
    logger,
    gasPriceMin,
    gasPriceMax,
    gasPriceMultiplier,
    debugProvider,
  }: SubmitterProps) {
    this.logger = logger || new SimpleLogger();
    const provider = signer.provider as providers.JsonRpcProvider;
    this.provider = provider;
    this.hashSubmitter = requestHashSubmitterArtifact.connect(
      network,
      signer,
    ) as RequestOpenHashSubmitter; // type mismatch with ethers.
    this.gasFeeDefiner = new GasFeeDefiner({
      provider,
      gasPriceMin,
      gasPriceMax,
      gasPriceMultiplier,
      logger: this.logger,
    });
    if (debugProvider) {
      this.provider.on('debug', (event) => {
        this.logger.debug('JsonRpcProvider debug event', event);
      });
    }
  }

  get hashSubmitterAddress(): string {
    return this.hashSubmitter.address;
  }

  async initialize(): Promise<void> {
    this.enableEip1559 = await isEip1559Supported(this.provider, this.logger);
  }

  /** Returns whether EIP-1559 is supported by the underlying provider. */
  supportsEip1559() {
    return this.enableEip1559;
  }

  /** Submits an IPFS hash, with fees according to `ipfsSize` */
  async submit(ipfsHash: string, ipfsSize: number): Promise<ContractTransaction> {
    const preparedTransaction = await this.prepareSubmit(ipfsHash, ipfsSize);
    return await this.hashSubmitter.signer.sendTransaction(preparedTransaction);
  }

  /** Encodes the submission of an IPFS hash, with fees according to `ipfsSize` */
  async prepareSubmit(ipfsHash: string, ipfsSize: number): Promise<providers.TransactionRequest> {
    const fee = await this.hashSubmitter.getFeesAmount(ipfsSize);
    const gasFees = this.enableEip1559 ? await this.gasFeeDefiner.getGasFees() : {};

    const tx = this.hashSubmitter.interface.encodeFunctionData('submitHash', [
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
    ]);

    return { to: this.hashSubmitter.address, data: tx, value: fee, ...gasFees };
  }
}
