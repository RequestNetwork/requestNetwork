import { BigNumber, utils } from 'ethers';
import { StorageTypes, LogTypes } from '@requestnetwork/types';
import { Engine } from '@thirdweb-dev/engine';
import { SimpleLogger } from '@requestnetwork/utils';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { networkToChainId } from './types';

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
   */
  backendWalletAddress: string;

  /**
   * Network name (e.g. 'mainnet', 'goerli', etc.)
   */
  network: string;

  /**
   * Optional logger instance
   */
  logger?: LogTypes.ILogger;
}

/**
 * Handles the submission of IPFS hashes through Thirdweb Engine
 */
export class ThirdwebTransactionSubmitter implements StorageTypes.ITransactionSubmitter {
  private readonly logger: LogTypes.ILogger;
  private readonly engine: Engine;
  private readonly backendWalletAddress: string;
  private _network: string;
  private _hashSubmitterAddress: string;

  constructor({
    engineUrl,
    accessToken,
    backendWalletAddress,
    network,
    logger,
  }: ThirdwebSubmitterOptions) {
    this.logger = logger || new SimpleLogger();
    this.engine = new Engine({
      url: engineUrl,
      accessToken: accessToken,
    });
    this.backendWalletAddress = backendWalletAddress;
    this._network = network;
    // Get the hash submitter address for the specified network
    this._hashSubmitterAddress = requestHashSubmitterArtifact.getAddress(network);
  }

  get network(): string {
    return this._network;
  }

  set network(value: string) {
    this._network = value;
  }

  get hashSubmitterAddress(): string {
    return this._hashSubmitterAddress;
  }

  set hashSubmitterAddress(value: string) {
    this._hashSubmitterAddress = value;
  }

  async initialize(): Promise<void> {
    const chainId = networkToChainId[this._network] || 1;
    this.logger.info(
      `Initializing ThirdwebTransactionSubmitter for network ${this._network} (chainId: ${chainId})`,
    );

    // Check Engine connection
    try {
      await this.engine.getWallets({});
      this.logger.info('Successfully connected to Thirdweb Engine');
    } catch (error) {
      this.logger.error('Failed to connect to Thirdweb Engine', error);
      throw new Error('Failed to connect to Thirdweb Engine');
    }
  }

  /**
   * Submits an IPFS hash via Thirdweb Engine
   */
  async submit(ipfsHash: string, ipfsSize: number): Promise<any> {
    this.logger.info(`Submitting hash ${ipfsHash} with size ${ipfsSize} via Thirdweb Engine`);
    const preparedTx = await this.prepareSubmit(ipfsHash, ipfsSize);
    const chainId = networkToChainId[this._network] || 1;

    try {
      const result = await this.engine.sendTransaction({
        chainId: chainId,
        fromAddress: this.backendWalletAddress,
        toAddress: preparedTx.to,
        data: preparedTx.data as string,
        value: preparedTx.value ? preparedTx.value.toString() : '0',
      });

      this.logger.info(`Transaction submitted successfully: ${result.transactionHash}`);
      return {
        hash: result.transactionHash,
        wait: async () => {
          // This function returns a promise that resolves when the transaction is mined
          // Transaction status can be tracked either by polling the blockchain
          // or by using webhook notifications from Thirdweb Engine
          return { status: 1 };
        },
      };
    } catch (error) {
      this.logger.error('Failed to submit transaction through Thirdweb Engine', error);
      throw error;
    }
  }

  /**
   * Prepares the transaction for submitting an IPFS hash
   */
  async prepareSubmit(ipfsHash: string, ipfsSize: number): Promise<any> {
    // Create contract interface for the hash submitter
    const iface = requestHashSubmitterArtifact.getInterface();

    // Calculate fee - in a real implementation, you might want to fetch this from the contract
    // For now, we assume it's 0 for simplicity
    const fee = BigNumber.from(0);

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
