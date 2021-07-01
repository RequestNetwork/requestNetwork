import { PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { getTheGraphClient, TheGraphClient } from '../thegraph';

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
    private paymentReference: string,
    private proxyContractAddress: string,
    private tokenContractAddress: string,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    this.client = getTheGraphClient(this.network);
  }

  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = {
      contractAddress: this.proxyContractAddress,
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      tokenAddress: this.tokenContractAddress,
    };
    const payments = await this.client.GetPayments(variables);
    return payments.payments.map((p) => ({
      amount: p.amount,
      name: this.eventName,
      parameters: {
        to: utils.getAddress(this.toAddress),
        from: utils.getAddress(p.from),
        txHash: p.txHash,
        gasUsed: p.gasUsed,
        gasPrice: p.gasPrice,
        block: p.block,
        feeAddress: p.feeAddress ? utils.getAddress(p.feeAddress) : undefined,
        feeAmount: p.feeAmount || undefined,
      },
      timestamp: p.timestamp,
    }));
  }
}

export default TheGraphInfoRetriever;
