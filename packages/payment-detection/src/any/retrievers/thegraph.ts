import { CurrencyDefinition } from '@requestnetwork/currency';
import { PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { IPaymentRetriever } from '../../types';
import { getTheGraphClient, TheGraphClient } from '../../thegraph';
import { unpadAmountFromChainlink } from '../../utils';

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export class TheGraphConversionRetriever
  implements IPaymentRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  private client: TheGraphClient;

  /**
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param contractAddress The address of the proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   * @param acceptedTokens The list of ERC20 tokens addresses accepted for payments and refunds
   * @param maxRateTimespan The the maximum span between the time the rate was fetched and the payment
   */
  constructor(
    private requestCurrency: CurrencyDefinition,
    private paymentReference: string,
    private contractAddress: string,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private acceptedTokens?: string[],
    private maxRateTimespan: number = 0,
  ) {
    this.client = getTheGraphClient(this.network);

    this.acceptedTokens = acceptedTokens?.map((token) => token.toLowerCase());
  }

  /**
   * Retrieves transfer events from the payment proxy and conversion proxy.
   * Logs from both proxies are matched by transaction hash, as both proxies should
   * be called in one transaction.
   *
   * The conversion proxy's logs are used to compute the amounts in request currency (typically fiat).
   * The payment proxy's logs are used the same way as for a pn-fee-proxy request.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = {
      contractAddress: this.contractAddress,
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      maxRateTimespan: this.maxRateTimespan,
    };
    // Parses, filters and creates the events from the logs with the payment reference
    const events = await this.client.GetConversionPayments(variables);
    // Creates the balance events
    return events.payments
      .filter((payment) => {
        if (this.acceptedTokens && this.acceptedTokens.length > 0) {
          return this.acceptedTokens.includes(payment.tokenAddress?.toLowerCase());
        }
        return !payment.tokenAddress;
      })
      .map((payment) => {
        const requestCurrency = this.requestCurrency;
        const { amount, feeAmount } = payment;

        const amountWithRightDecimal = unpadAmountFromChainlink(amount, requestCurrency);
        const feeAmountWithRightDecimal = unpadAmountFromChainlink(feeAmount, requestCurrency);
        return {
          amount: amountWithRightDecimal.toString(),
          name: this.eventName,
          parameters: {
            block: payment.block,
            feeAddress: payment.feeAddress ? utils.getAddress(payment.feeAddress) : undefined,
            feeAmount: feeAmountWithRightDecimal.toString(),
            feeAmountInCrypto: payment.feeAmountInCrypto || undefined,
            amountInCrypto: payment.amountInCrypto,
            tokenAddress: payment.tokenAddress ? utils.getAddress(payment.tokenAddress) : undefined,
            to: this.toAddress,
            txHash: payment.txHash,
            maxRateTimespan: payment.maxRateTimespan?.toString(),
          },
          timestamp: payment.timestamp,
        };
      });
  }
}
