import { PaymentTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { getDefaultProvider } from '../provider';
import { parseLogArgs } from '../utils';

// The ERC20 escrow smart contract ABI fragment containing escrow specific events
const erc20EscrowContractAbiFragment = [
  'event TransferWithReferenceAndFee(address tokenAddress, address to,uint256 amount,bytes indexed paymentReference,uint256 feeAmount,address feeAddress)',
  'event RequestFrozen(bytes indexed paymentReference)',
  'event InitiatedEmergencyClaim(bytes indexed paymentReference)',
  'event RevertedEmergencyClaim(bytes indexed paymentReference)',
];

/** Escrow contract event */
type EscrowArgs = {
  paymentReference: string;
};

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a escrow contract
 */
export default class escrowERC20InfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  public contractEscrow: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment
   * @param escrowContractAddress The address of the escrow contract
   * @param escrowCreationBlockNumber The block that created the escrow contract
   * @param amount The amount
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private paymentReference: string,
    private escrowContractAddress: string,
    private escrowCreationBlockNumber: number,
    private amount: string,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    // Creates a local or default provider
    this.provider = getDefaultProvider(this.network);

    // Setup the ERC20 escrow contract interface
    this.contractEscrow = new ethers.Contract(
      this.escrowContractAddress,
      erc20EscrowContractAbiFragment,
      this.provider,
    );
  }

  /**
   * Retrieves events for the current contract, address and network.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    // Create a filter to find all the RequestFrozen logs with the payment reference
    const freezeFilter = this.contractEscrow.filters.RequestFrozen(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Create a filter to find all the Init Emergency logs with the payment reference
    const initEmergencyFilter = this.contractEscrow.filters.InitiatedEmergencyClaim(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Create a filter to find all the Fee Transfer logs with the payment reference
    const revertEmergencyFilter = this.contractEscrow.filters.EmergencyClaimReverted(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Get the RequestFrozen event logs
    const freezeLogs = await this.provider.getLogs(freezeFilter);

    // Get the InitiateEmergencyClaim event logs
    const initEmergencyLogs = await this.provider.getLogs(initEmergencyFilter);

    // Get the RequestFrozen event logs
    const revertEmergencyLogs = await this.provider.getLogs(revertEmergencyFilter);

    // Merge events if multiple logs
    const logs = [...freezeLogs, ...initEmergencyLogs, ...revertEmergencyLogs];

    // Parses, filters and creates the events from the logs with the payment reference
    const eventPromises = logs
      // Parses the logs
      .map((log) => {
        const parsedLog = this.contractEscrow.interface.parseLog(log);
        return {
          parsedLog: parseLogArgs<EscrowArgs>(parsedLog),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      })
      // Keeps only the log with the right paymentReference.
      .filter(
        ({ parsedLog }) =>
          parsedLog.paymentReference.toLowerCase() === this.paymentReference.toLowerCase(),
      )
      // Creates the escrow events
      .map(async ({ parsedLog, blockNumber, transactionHash }) => ({
        amount: this.amount,
        name: this.eventName,
        parameters: {
          block: blockNumber,
          paymentRefrence: parsedLog.paymentReference,
          to: this.toAddress,
          txHash: transactionHash,
        },
        timestamp: (await this.provider.getBlock(blockNumber || 0)).timestamp,
      }));

    return Promise.all(eventPromises);
  }
}
