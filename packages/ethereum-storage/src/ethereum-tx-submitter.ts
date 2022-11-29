import { BigNumber, ContractTransaction, providers, utils } from 'ethers';
import Utils from '@requestnetwork/utils';
import { LogTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { RequestOpenHashSubmitter } from '@requestnetwork/smart-contracts/types';
import { suggestFees } from 'eip1559-fee-suggestions-ethers';
import { SubmitterProps } from './ethereum-storage-ethers';

/**
 * Handles the submission of a hash on the request HashSubmitter contract
 */
export class EthereumTransactionSubmitter {
  private readonly logger: LogTypes.ILogger;
  private enableEip1559 = true;
  private readonly hashSubmitter: RequestOpenHashSubmitter;
  private readonly provider: providers.JsonRpcProvider;

  constructor({ network, signer, logger }: SubmitterProps) {
    this.logger = logger || new Utils.SimpleLogger();
    this.provider = signer.provider as providers.JsonRpcProvider;
    this.hashSubmitter = requestHashSubmitterArtifact.connect(
      network,
      signer,
    ) as RequestOpenHashSubmitter; // type mismatch with ethers.
  }

  async initialize(): Promise<void> {
    try {
      await this.provider.send('eth_feeHistory', [1, 'latest', []]);
    } catch (e) {
      this.logger.warn(
        'This RPC provider does not support the "eth_feeHistory" method: switching to legacy gas price',
      );
      this.enableEip1559 = false;
    }
  }

  /** Submits an IPFS hash, with fees according to `ipfsSize`  */
  async submit(ipfsHash: string, ipfsSize: number): Promise<ContractTransaction> {
    const preparedTransaction = await this.prepareSubmit(ipfsHash, ipfsSize);
    return await this.hashSubmitter.signer.sendTransaction(preparedTransaction);
  }

  /** Encodes the submission of an IPFS hash, with fees according to `ipfsSize` */
  async prepareSubmit(ipfsHash: string, ipfsSize: number): Promise<providers.TransactionRequest> {
    const fee = await this.hashSubmitter.getFeesAmount(ipfsSize);
    const gasFees = await this.getGasFees();

    const tx = this.hashSubmitter.interface.encodeFunctionData('submitHash', [
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
    ]);

    return { to: this.hashSubmitter.address, data: tx, value: fee, ...gasFees };
  }

  private async getGasFees(): Promise<{
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  }> {
    if (!this.enableEip1559) {
      return {};
    }
    const suggestedFee = await suggestFees(
      this.hashSubmitter.provider as providers.JsonRpcProvider,
    );
    const maxPriorityFeePerGas = BigNumber.from(suggestedFee.maxPriorityFeeSuggestions.urgent);
    const maxFeePerGas = maxPriorityFeePerGas.add(suggestedFee.baseFeeSuggestion);

    return {
      maxPriorityFeePerGas: maxPriorityFeePerGas.gt(0) ? maxPriorityFeePerGas : undefined,
      maxFeePerGas: maxFeePerGas.gt(0) ? maxFeePerGas : undefined,
    };
  }
}
