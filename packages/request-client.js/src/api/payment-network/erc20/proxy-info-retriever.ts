import { ethers } from 'ethers';
import * as Types from '../../../types';

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc20proxyContractAbiFragment = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'bytes',
        name: 'transferReference',
        type: 'bytes',
      },
    ],
    name: 'TransferWithReference',
    type: 'event',
  },
];

/**
 * Retrieves a list of transfer events for an address
 */
export default class ProxyERC20InfoRetriever
  implements Types.IPaymentNetworkInfoRetriever<Types.ERC20PaymentNetworkEvent> {
  public contractProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param tokenContractAddress The address of the ERC20 contract
   * @param address Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private requestId: string,
    private proxyContractAddress: string,
    private tokenContractAddress: string,
    private toAddress: string,
    private eventName: Types.EVENTS_NAMES,
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
  public async getTransferEvents(): Promise<Types.ERC20PaymentNetworkEvent[]> {
    // Create a filter to find all the Transfer logs for the toAddress
    const filter = this.contractProxy.filters.TransferWithReference(
      null,
      this.toAddress,
      null,
      '0x' + this.requestId,
    ) as ethers.providers.Filter;
    filter.fromBlock = 0;
    filter.toBlock = 'latest';

    // Get the event logs
    const logs = await this.provider.getLogs(filter);

    // Clean up the Transfer logs data
    const eventPromises = logs
      .map(log => {
        const parsedLog = this.contractProxy.interface.parseLog(log);
        return { parsedLog, log };
      })
      .filter(
        log =>
          log.parsedLog.values.tokenAddress.toLowerCase() ===
          this.tokenContractAddress.toLowerCase(),
      )
      .map(async t => ({
        amount: t.parsedLog.values.amount.toString(),
        name: this.eventName,
        parameters: {
          block: t.log.blockNumber,
          from: 'TODO',
          to: this.toAddress,
          txHash: t.log.transactionHash,
        },
        timestamp: (await this.provider.getBlock(t.log.blockNumber || 0)).timestamp,
      }));

    // TODO
    // const balance = events.reduce((balanceTempStr, event) => {
    //   const balanceTemp = new bigNumber(balanceTempStr);
    //   const amount = new bigNumber(event.amount);
    //   return balanceTemp.add(amount).toString();
    // }, '0');

    return Promise.all(eventPromises);
  }
}
