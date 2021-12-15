import { PaymentTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { getDefaultProvider } from '../provider';
import { parseLogArgs } from '../utils';

// The ERC20 escrow smart contract ABI fragment containing escrow specific events.
const erc20EscrowContractAbiFragment = [
  'event RequestFrozen(bytes indexed paymentReference)',
  'event InitiatedEmergencyClaim(bytes indexed paymentReference)',
  'event RevertedEmergencyClaim(bytes indexed paymentReference)',
];

/** Escrow contract event arguments. */
type EscrowArgs = {
  paymentReference: string;
};

/**
 * Retrieves a list of payment events from a escrow contract.
 */
export default class EscrowERC20InfoRetriever
  implements
    PaymentTypes.IPaymentNetworkBaseInfoRetriever<
      PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>,
      PaymentTypes.ESCROW_EVENTS_NAMES
    > {
  public contractEscrow: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment.
   * @param escrowContractAddress The address of the escrow contract.
   * @param escrowCreationBlockNumber The block that created the escrow contract.
   * @param network The Ethereum network to use.
   */
  constructor(
    private paymentReference: string,
    private escrowContractAddress: string,
    private escrowCreationBlockNumber: number,
    private network: string,
  ) {
    // Creates a local or default provider.
    this.provider = getDefaultProvider(this.network);

    // Setup the ERC20 escrow contract interface.
    this.contractEscrow = new ethers.Contract(
      this.escrowContractAddress,
      erc20EscrowContractAbiFragment,
      this.provider,
    );
  }

  /**
   * Retrieves events for the current contract, address and network.
   */
  public async getContractEvents(): Promise<
    PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>[]
  > {
    // Create a filter to find all the RequestFrozen logs with the payment reference
    const freezeFilter = this.contractEscrow.filters.RequestFrozen(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Create a filter to find all the Init Emergency logs with the payment reference.
    const initEmergencyFilter = this.contractEscrow.filters.InitiatedEmergencyClaim(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Create a filter to find all the Fee Transfer logs with the payment reference.
    const revertEmergencyFilter = this.contractEscrow.filters.RevertedEmergencyClaim(
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    freezeFilter.fromBlock = this.escrowCreationBlockNumber;
    freezeFilter.toBlock = 'latest';

    // Get the RequestFrozen event logs.
    const freezeLog = await this.provider.getLogs(freezeFilter);

    // Get the InitiateEmergencyClaim event logs.
    const initEmergencyLog = await this.provider.getLogs(initEmergencyFilter);

    // Get the RequestFrozen event logs.
    const revertEmergencyLog = await this.provider.getLogs(revertEmergencyFilter);

    interface EthersLogWithEventName extends ethers.providers.Log {
      eventName: PaymentTypes.ESCROW_EVENTS_NAMES;
    }

    // Merge events if multiple logs.
    const logs: EthersLogWithEventName[] = [
      ...freezeLog.map((i) => ({
        ...i,
        eventName: PaymentTypes.ESCROW_EVENTS_NAMES.FROZEN_PAYMENT,
      })),
      ...initEmergencyLog.map((i) => ({
        ...i,
        eventName: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM,
      })),
      ...revertEmergencyLog.map((i) => ({
        ...i,
        eventName: PaymentTypes.ESCROW_EVENTS_NAMES.REVERTED_EMERGENCY_CLAIM,
      })),
    ];

    // Parses, filters and creates the events from the logs with the payment reference.
    const eventPromises = logs
      // Parses the logs
      .map((log) => {
        const parsedLog = this.contractEscrow.interface.parseLog(log);
        return {
          ...log,
          parsedLog: parseLogArgs<EscrowArgs>(parsedLog),
        };
      })

      // Creates the escrow events.
      .map(async ({ parsedLog, blockNumber, transactionHash, eventName }) => ({
        name: eventName,
        parameters: {
          block: blockNumber,
          paymentReference: parsedLog.paymentReference,
          txHash: transactionHash,
        },
        timestamp: (await this.provider.getBlock(blockNumber || 0)).timestamp,
      }));

    return Promise.all(eventPromises);
  }
}
