import { PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { getTheGraphClient, TheGraphClient } from '../thegraph';

/** Parameters for getting payment events from theGraph */
export type GraphPaymentQueryParams = {
  contractAddress: string;
  reference: string;
  to: string;
  tokenAddress: string | null;
};

export class TheGraphInfoRetriever {
  private client: TheGraphClient;

  /**
   * @param paymentReference The reference to identify the payment
   * @param proxyContractAddress The address of the proxy contract
   * @param tokenContractAddress The address of the ERC20 contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    protected paymentReference: string,
    protected proxyContractAddress: string,
    protected tokenContractAddress: string,
    protected toAddress: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    protected network: string,
  ) {
    this.client = getTheGraphClient(this.network);
  }

  protected getGraphVariables(): GraphPaymentQueryParams {
    return {
      contractAddress: this.proxyContractAddress,
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      tokenAddress: this.tokenContractAddress,
    };
  }

  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = this.getGraphVariables();
    const payments = await this.client.GetPayments(variables);
    return payments.payments.map((p) => ({
      amount: p.amount,
      name: this.eventName,
      parameters: {
        to: this.toAddress,
        txHash: p.txHash,
        block: p.block,
        feeAddress: p.feeAddress ? utils.getAddress(p.feeAddress) : undefined,
        feeAmount: p.feeAmount || undefined,
      },
      timestamp: p.timestamp,
    }));
  }
}

export default TheGraphInfoRetriever;
