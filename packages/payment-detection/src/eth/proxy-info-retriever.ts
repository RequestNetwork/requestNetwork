import { PaymentTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';

// The Ethereum proxy smart contract ABI fragment containing TransferWithReference event
const ethProxyContractAbiFragment = [
  'event TransferWithReference(address to,uint256 amount,bytes indexed paymentReference)',
];

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export default class ProxyEthereumInfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ETHPaymentNetworkEvent> {
  public contractProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment
   * @param proxyContractAddress The address of the proxy contract
   * @param proxyCreationBlockNumber The block that created the proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private paymentReference: string,
    private proxyContractAddress: string,
    private proxyCreationBlockNumber: number,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    // Creates a local or default provider
    this.provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the Ethereum proxy contract interface
    this.contractProxy = new ethers.Contract(
      this.proxyContractAddress,
      ethProxyContractAbiFragment,
      this.provider,
    );
  }

  /**
   * Retrieves transfer events for the current contract, address and network.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    // Create a filter to find all the Transfer logs for the toAddress
    const filter = this.contractProxy.filters.TransferWithReference(
      null,
      null,
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    filter.fromBlock = this.proxyCreationBlockNumber;
    filter.toBlock = 'latest';

    // Get the event logs
    const logs = await this.provider.getLogs(filter);

    // Parses, filters and creates the events from the logs of the proxy contract
    const eventPromises = logs
      // Parses the logs
      .map(log => {
        const parsedLog = this.contractProxy.interface.parseLog(log);
        return { parsedLog, log };
      })
      // Keeps only the log with the right token and the right destination address
      .filter(log => log.parsedLog.values.to.toLowerCase() === this.toAddress.toLowerCase())
      // Creates the balance events
      .map(async t => ({
        amount: t.parsedLog.values.amount.toString(),
        name: this.eventName,
        parameters: {
          block: t.log.blockNumber,
          txHash: t.log.transactionHash,
        },
        timestamp: (await this.provider.getBlock(t.log.blockNumber || 0)).timestamp,
      }));

    return Promise.all(eventPromises);
  }
}
