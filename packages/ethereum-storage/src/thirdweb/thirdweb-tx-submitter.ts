import { BigNumber, utils, providers } from 'ethers';
import { StorageTypes, LogTypes } from '@requestnetwork/types';
import { Engine } from '@thirdweb-dev/engine';
import { SimpleLogger } from '@requestnetwork/utils';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import type { CurrencyTypes } from '@requestnetwork/types';
import { getChainId, networkToChainId } from './types';

export interface ThirdwebSubmitterOptions {
  /**
   * The URL of your Thirdweb Engine instance
   */
  engineUrl: string;

  /**
   * The access token for Thirdweb Engine
   */
  accessToken: string;

  /**
   * The address of the wallet configured in Thirdweb Engine
   * This is the wallet that will sign and send transactions
   */
  backendWalletAddress: string;

  /**
   * Network name (e.g. 'gnosis', 'sepolia', etc.)
   */
  network: CurrencyTypes.EvmChainName;

  /**
   * Optional logger instance
   */
  logger?: LogTypes.ILogger;

  /**
   * Optional RPC URL for the network. If not provided, will use default public RPC.
   */
  rpcUrl?: string;
}

/**
 * Handles the submission of IPFS CID hashes using Thirdweb Engine.
 * Thirdweb Engine manages transaction signing, fee estimation, and automatically
 * handles retries for failed transactions.
 */
export class ThirdwebTransactionSubmitter implements StorageTypes.ITransactionSubmitter {
  private readonly logger: LogTypes.ILogger;
  private readonly engine: Engine;
  private readonly backendWalletAddress: string;
  private readonly provider: providers.Provider;

  // Public variables instead of getters/setters
  public network: CurrencyTypes.EvmChainName;
  public hashSubmitterAddress: string;

  constructor({
    engineUrl,
    accessToken,
    backendWalletAddress,
    network,
    logger,
    rpcUrl,
  }: ThirdwebSubmitterOptions) {
    this.logger = logger || new SimpleLogger();
    this.engine = new Engine({
      url: engineUrl,
      accessToken: accessToken,
    });
    this.backendWalletAddress = backendWalletAddress;
    this.network = network;
    // Get the hash submitter address for the specified network
    this.hashSubmitterAddress = requestHashSubmitterArtifact.getAddress(network);

    // Initialize provider with RPC URL if provided, otherwise use default network name
    this.provider = rpcUrl
      ? new providers.JsonRpcProvider(rpcUrl)
      : providers.getDefaultProvider(network);
  }

  async initialize(): Promise<void> {
    const chainId = networkToChainId[this.network] || 1;
    this.logger.info(
      `Initializing ThirdwebTransactionSubmitter for network ${this.network} (chainId: ${chainId})`,
    );

    // Check Engine connection
    try {
      await this.engine.default.getOpenapiJson();
      this.logger.info('Successfully connected to Thirdweb Engine');
    } catch (error) {
      this.logger.error('Failed to connect to Thirdweb Engine', error);
      throw new Error('Failed to connect to Thirdweb Engine');
    }
  }

  /**
   * Submits an IPFS CID hash via Thirdweb Engine
   * @param ipfsHash - The IPFS CID hash to submit
   * @param ipfsSize - The size of the data on IPFS
   * @returns A transaction object compatible with ethers.js TransactionResponse interface
   */
  async submit(ipfsHash: string, ipfsSize: number): Promise<any> {
    this.logger.info(`Submitting IPFS CID ${ipfsHash} with size ${ipfsSize} via Thirdweb Engine`);
    const preparedTx = await this.prepareSubmit(ipfsHash, ipfsSize);
    const chainId = getChainId(this.network);

    try {
      const result = await this.engine.backendWallet.sendTransaction(
        chainId,
        this.backendWalletAddress,
        {
          toAddress: preparedTx.to,
          data: preparedTx.data,
          value: preparedTx.value ? preparedTx.value.toString() : '0',
        },
      );

      this.logger.info(`Transaction submitted. Queue ID: ${result.result.queueId}`);

      // Return a complete ethers.js TransactionResponse-compatible object for an EIP-1559 transaction
      return {
        // Only available for mined transactions
        blockHash: null,
        blockNumber: null,
        timestamp: Math.floor(Date.now() / 1000),
        transactionIndex: null,

        // Transaction details
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        from: this.backendWalletAddress,
        chainId,
        to: preparedTx.to,
        nonce: 0, // Not available from Thirdweb Engine
        gasLimit: BigNumber.from(2000000),
        gasPrice: null, // Not used in EIP-1559 transactions
        data: preparedTx.data,
        value: preparedTx.value || BigNumber.from(0),
        confirmations: 1,

        // EIP-1559 fields
        maxPriorityFeePerGas: BigNumber.from(2000000000), // 2 Gwei tip
        maxFeePerGas: BigNumber.from(50000000000), // 50 Gwei max fee

        // Transaction type (2: EIP-1559)
        type: 2,

        // Signature components (not available)
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        v: 0,

        /**
         * Returns a promise that resolves to a transaction receipt.
         *
         * This implements a "fire and forget" pattern - we submit the transaction
         * to Thirdweb Engine and immediately assume success without waiting for
         * or confirming that the transaction is actually mined.
         *
         * We don't use polling or webhook notifications to track transaction status.
         * Thirdweb Engine handles retries and gas price adjustments internally.
         *
         * @returns A simplified TransactionReceipt compatible with ethers.js
         */
        wait: async () => {
          return {
            // TransactionReceipt properties
            transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            blockNumber: 0,
            blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            confirmations: 1,
            status: 1, // 1 = success
            from: this.backendWalletAddress,
            to: preparedTx.to,
            contractAddress: null,
            transactionIndex: 0,
            gasUsed: BigNumber.from(0),
            cumulativeGasUsed: BigNumber.from(0),
            effectiveGasPrice: BigNumber.from(0),
            logs: [],
            logsBloom:
              '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            type: 2, // EIP-1559 transaction type
          };
        },
      };
    } catch (error) {
      this.logger.error('Failed to submit transaction through Thirdweb Engine', error);
      throw error;
    }
  }

  /**
   * Prepares the transaction for submitting an IPFS CID hash
   * @param ipfsHash - The IPFS CID hash to submit
   * @param ipfsSize - The size of the data on IPFS
   * @returns A transaction request object compatible with ethers.js
   */
  async prepareSubmit(ipfsHash: string, ipfsSize: number): Promise<any> {
    // Create contract interface for the hash submitter
    const iface = requestHashSubmitterArtifact.getInterface();

    // Get the fee from the contract - now using provider
    const hashSubmitter = requestHashSubmitterArtifact.connect(this.network, this.provider);
    const fee = await hashSubmitter.getFeesAmount(ipfsSize);

    // Encode function data
    const data = iface.encodeFunctionData('submitHash', [
      ipfsHash,
      utils.hexZeroPad(utils.hexlify(ipfsSize), 32),
    ]);

    return {
      to: this.hashSubmitterAddress,
      data: data,
      value: fee,
    };
  }
}
