import { PaymentTypes } from '@requestnetwork/types';
import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';
import { BigNumber, ethers } from 'ethers';
import { IEventRetriever } from '../types.js';
import { makeGetDeploymentInformation, parseLogArgs } from '../utils.js';
import { getDefaultProvider } from '@requestnetwork/utils';

const ESCROW_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.1.0',
};

/** Escrow contract event arguments. */
type EscrowArgs = {
  paymentReference: string;
};

type TransferWithReferenceAndFeeArgs = EscrowArgs & {
  tokenAddress: string;
  to: string;
  amount: BigNumber;
  feeAmount: BigNumber;
  feeAddress: string;
};

/**
 * Retrieves a list of payment events from an escrow contract.
 */
export class EscrowERC20InfoRetriever
  implements
    IEventRetriever<
      PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>,
      PaymentTypes.ESCROW_EVENTS_NAMES
    >
{
  public contractEscrow: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment.
   * @param escrowContractAddress The address of the escrow contract.
   * @param escrowCreationBlockNumber The block that created the escrow contract.
   * @param tokenContractAddress The address of the ERC20 contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or escrow
   * @param network The Ethereum network to use.
   */
  constructor(
    private paymentReference: string,
    private escrowContractAddress: string,
    private escrowCreationBlockNumber: number,
    private tokenContractAddress: string,
    private toAddress: string,
    private network: string,
    private eventName?: PaymentTypes.ESCROW_EVENTS_NAMES,
  ) {
    // Creates a local or default provider.
    this.provider = getDefaultProvider(this.network);

    // Set up the ERC20 escrow contract interface.
    this.contractEscrow = new ethers.Contract(
      this.escrowContractAddress,
      erc20EscrowToPayArtifact.getContractAbi(),
      this.provider,
    );
  }
  /**
   * Retrieves events for the current contract, address and network.
   */
  public async getAllContractEvents(): Promise<
    PaymentTypes.IPaymentNetworkEscrowEvent<
      PaymentTypes.GenericEventParameters,
      PaymentTypes.ESCROW_EVENTS_NAMES
    >[]
  > {
    const freezeEvents = await this.getContractEventsForEventName(
      PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW,
    );
    const initEmergencyEvents = await this.getContractEventsForEventName(
      PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM,
    );
    const revertEmergencyEvents = await this.getContractEventsForEventName(
      PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM,
    );

    return [...freezeEvents, ...initEmergencyEvents, ...revertEmergencyEvents];
  }

  public async getContractEvents(): Promise<
    PaymentTypes.IPaymentNetworkEscrowEvent<
      PaymentTypes.GenericEventParameters,
      PaymentTypes.ESCROW_EVENTS_NAMES
    >[]
  > {
    if (!this.eventName) {
      throw new Error('Missing event name in EscrowInfoRetriever for getContractEvents()');
    }
    return this.getContractEventsForEventName(this.eventName);
  }

  /**
   * Retrieves events for the current contract, address and network.
   */
  public async getContractEventsForEventName(
    eventName: PaymentTypes.ESCROW_EVENTS_NAMES,
  ): Promise<
    PaymentTypes.IPaymentNetworkEscrowEvent<
      PaymentTypes.GenericEventParameters,
      PaymentTypes.ESCROW_EVENTS_NAMES
    >[]
  > {
    const filter: ethers.providers.Filter | undefined =
      eventName === PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW
        ? // Create a filter to find all the RequestFrozen logs with the payment reference
          this.contractEscrow.filters.RequestFrozen('0x' + this.paymentReference)
        : eventName === PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM
        ? this.contractEscrow.filters.InitiatedEmergencyClaim('0x' + this.paymentReference)
        : eventName === PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM
        ? this.contractEscrow.filters.RevertedEmergencyClaim('0x' + this.paymentReference)
        : eventName === PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW
        ? this.contractEscrow.filters.TransferWithReferenceAndFee(
            null,
            // TODO: be sure null is a good idea
            null,
            null,
            '0x' + this.paymentReference,
            null,
            null,
          )
        : undefined;

    if (!filter) {
      throw new Error('Wrong eventName for Escrow event retriever');
    }

    filter.fromBlock = this.escrowCreationBlockNumber;
    filter.toBlock = 'latest';

    const logs = await this.provider.getLogs(filter);

    // Parses, filters and creates the events from the logs with the payment reference.
    const eventPromises = logs
      // Parses the logs
      .map((log) => {
        const parsedLog = this.contractEscrow.interface.parseLog(log);
        return {
          ...log,
          parsedLog: parseLogArgs<TransferWithReferenceAndFeeArgs>(parsedLog),
        };
      })

      // Keeps only the log with the right token and the right destination address
      .filter(({ parsedLog }) => {
        if (parsedLog.tokenAddress) {
          return (
            parsedLog.tokenAddress.toLowerCase() === this.tokenContractAddress.toLowerCase() &&
            parsedLog.to.toLowerCase() === this.toAddress.toLowerCase()
          );
        } else {
          return true;
        }
      })

      // Creates the escrow events.
      .map(async ({ parsedLog, blockNumber, transactionHash }) => ({
        // TODO fix me
        amount: parsedLog.amount?.toString() || undefined,
        name: eventName,
        parameters: {
          block: blockNumber,
          paymentReference: parsedLog.paymentReference,
          feeAddress: parsedLog.feeAddress || undefined,
          feeAmount: parsedLog.feeAmount?.toString() || undefined,
          to: this.toAddress || undefined,
          txHash: transactionHash,
        },
        timestamp: (await this.provider.getBlock(blockNumber || 0)).timestamp,
      }));

    return Promise.all(eventPromises);
  }

  /**
   * Retrieves current escrow data from requestMapping in the Escrow smart contract
   */
  public async getEscrowRequestMapping(): Promise<PaymentTypes.EscrowChainData> {
    return this.contractEscrow.requestMapping(`0x${this.paymentReference}`);
  }

  public static getEscrowDeploymentInformation = makeGetDeploymentInformation(
    erc20EscrowToPayArtifact,
    ESCROW_CONTRACT_ADDRESS_MAP,
  );
}
