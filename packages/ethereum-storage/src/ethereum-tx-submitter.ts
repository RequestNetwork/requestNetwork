import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { SimpleLogger, isEip1559Supported } from '@requestnetwork/utils';
import {
  Chain,
  ChainContract,
  Client,
  parseAbi,
  getContract,
  padHex,
  SimulateContractReturnType,
  GetContractReturnType,
  isHash,
  TransactionReceipt,
} from 'viem';
import {
  estimateFeesPerGas,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions';

export type SubmitterProps = {
  client: Client;
  chain: Chain;
  logger?: LogTypes.ILogger;
};

const abi = parseAbi([
  'function submitHash(string _hash, bytes _feesParameters) payable',
  'function getFeesAmount(uint256 _contentSize) view returns (uint256)',
]);

/**
 * Handles the submission of a hash on the request HashSubmitter contract
 */
export class EthereumTransactionSubmitter implements StorageTypes.ITransactionSubmitter {
  private readonly logger: LogTypes.ILogger;
  private enableEip1559 = true;
  private hashSubmitter: GetContractReturnType<typeof abi, Client, Client>;
  private readonly chain: Chain;
  private readonly client: Client;

  constructor({ chain, client, logger }: SubmitterProps) {
    this.logger = logger || new SimpleLogger();
    this.chain = chain;
    this.client = client;

    const hashSubmitter = this.chain.contracts?.hashSubmitter as ChainContract;
    if (!hashSubmitter || !hashSubmitter.address) {
      throw new Error(`hashSubmitter not found for ${this.chain.name}`);
    }
    this.hashSubmitter = getContract({
      abi,
      address: hashSubmitter.address,
      walletClient: this.client,
      publicClient: this.client,
    });
  }

  get hashSubmitterAddress(): string {
    return this.hashSubmitter.address;
  }

  async initialize(): Promise<void> {
    this.enableEip1559 = await isEip1559Supported(this.client, this.logger);
  }

  /** Submits an IPFS hash, with fees according to `ipfsSize`  */
  async submit(ipfsHash: string, ipfsSize: number): Promise<string> {
    const simulation = await this.prepareSubmit(ipfsHash, ipfsSize);
    return await writeContract(this.client, simulation);
  }

  async confirmTransaction(hash: string, confirmations: number): Promise<TransactionReceipt> {
    if (!isHash(hash)) {
      throw new Error('invalid hash');
    }
    return await waitForTransactionReceipt(this.client, { hash, confirmations });
  }

  /** Encodes the submission of an IPFS hash, with fees according to `ipfsSize` */
  async prepareSubmit(
    ipfsHash: string,
    ipfsSize: number,
  ): Promise<SimulateContractReturnType<typeof abi, 'submitHash'>['request']> {
    const gasParams = await estimateFeesPerGas(this.client, {
      chain: this.chain,
      type: this.enableEip1559 ? 'eip1559' : 'legacy',
    });
    const fee = await this.hashSubmitter.read.getFeesAmount([BigInt(ipfsSize)]);
    const simulation = await simulateContract(this.client, {
      ...gasParams,
      ...this.hashSubmitter,
      functionName: 'submitHash',
      args: [ipfsHash, padHex(`0x${ipfsSize}`)],
      value: fee,
    });

    return simulation.request;
  }
}
