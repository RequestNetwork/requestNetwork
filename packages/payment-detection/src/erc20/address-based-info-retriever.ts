import { PaymentTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';

// The ERC20 smart contract ABI fragment containing decimals property and Transfer event
const erc20BalanceOfAbiFragment = [
  // decimals property
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  // Transfer events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
];

/**
 * Retrieves a list of transfer events for an address
 */
export default class ERC20InfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  /**
   * @param tokenContractAddress The address of the ERC20 contract
   * @param address Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private tokenContractAddress: string,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {}

  /**
   * Retrieves transfer events for the current contract, address and network.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    // Creates a local or default provider
    const provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the ERC20 contract interface
    const contract = new ethers.Contract(
      this.tokenContractAddress,
      erc20BalanceOfAbiFragment,
      provider,
    );

    // Create a filter to find all the Transfer logs for the toAddress
    const filter = contract.filters.Transfer(null, this.toAddress) as ethers.providers.Filter;
    filter.fromBlock = 0;
    filter.toBlock = 'latest';

    // Get the event logs
    const logs = await provider.getLogs(filter);

    // Clean up the Transfer logs data
    const eventPromises = logs.map(async log => {
      if (!log.blockNumber) {
        throw new Error('Block number not found');
      }
      const block = await provider.getBlock(log.blockNumber);
      const parsedLog = contract.interface.parseLog(log);
      return {
        amount: parsedLog.values.value.toString(),
        name: this.eventName,
        parameters: {
          block: block.number,
          from: parsedLog.values.from,
          to: parsedLog.values.to,
          txHash: log.transactionHash,
        },
        timestamp: block.timestamp,
      };
    });

    return Promise.all(eventPromises);
  }
}
