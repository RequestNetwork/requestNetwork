import { PaymentTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc20proxyContractAbiFragment = [
  'event TransferWithReference(address tokenAddress,address to,uint256 amount,bytes indexed paymentReference)',
  'event TransferWithReferenceAndFee(address tokenAddress, address to,uint256 amount,bytes indexed paymentReference,uint256 feeAmount,address feeAddress);',
];

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export default class ProxyERC20InfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  public contractProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment
   * @param proxyContractAddress The address of the proxy contract
   * @param proxyCreationBlockNumber The block that created the proxy contract
   * @param tokenContractAddress The address of the ERC20 contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private paymentReference: string,
    private proxyContractAddress: string,
    private proxyCreationBlockNumber: number,
    private tokenContractAddress: string,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    // Creates a local or default provider
    this.provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the ERC20 proxy contract interface
    this.contractProxy = new ethers.Contract(
      this.proxyContractAddress,
      erc20proxyContractAbiFragment,
      this.provider,
    );
  }

  /**
   * Retrieves transfer events for the current contract, address and network.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    // Create a filter to find all the Transfer logs for the toAddress
    const filter = this.contractProxy.filters.TransferWithReference(
      null,
      null,
      null,
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    filter.fromBlock = this.proxyCreationBlockNumber;
    filter.toBlock = 'latest';

    // Get the proxy contract event logs
    const proxyLogs = await this.provider.getLogs(filter);

    // Create a filter to find all the Fee Transfer logs with the payment reference
    const feeFilter = this.contractProxy.filters.TransferWithReferenceAndFee(
      null,
      null,
      null,
      '0x' + this.paymentReference,
      null,
      null,
    ) as ethers.providers.Filter;
    feeFilter.fromBlock = this.proxyCreationBlockNumber;
    feeFilter.toBlock = 'latest';

    // Get the fee proxy contract event logs
    const feeProxyLogs = await this.provider.getLogs(feeFilter);

    // Merge both events
    const logs = [...proxyLogs, ...feeProxyLogs];

    // Parses, filters and creates the events from the logs with the payment reference
    const eventPromises = logs
      // Parses the logs
      .map(log => {
        const parsedLog = this.contractProxy.interface.parseLog(log);
        return { parsedLog, log };
      })
      // Keeps only the log with the right token and the right destination address
      .filter(
        log =>
          log.parsedLog.values.tokenAddress.toLowerCase() ===
            this.tokenContractAddress.toLowerCase() &&
          log.parsedLog.values.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // Creates the balance events
      .map(async t => ({
        amount: t.parsedLog.values.amount.toString(),
        name: this.eventName,
        parameters: {
          block: t.log.blockNumber,
          feeAddress: t.parsedLog.values.feeAddress || undefined,
          feeAmount: t.parsedLog.values.feeAmount?.toString() || undefined,
          to: this.toAddress,
          txHash: t.log.transactionHash,
        },
        timestamp: (await this.provider.getBlock(t.log.blockNumber || 0)).timestamp,
      }));

    return Promise.all(eventPromises);
  }
}
