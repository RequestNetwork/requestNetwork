import { Currency } from '@requestnetwork/currency';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, utils } from 'ethers';
import { getTheGraphClient, TheGraphClient } from '../thegraph';

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export class TheGraphAnyToErc20Retriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  private client: TheGraphClient;

  /**
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param conversionProxyContractAddress The address of the proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   * @param acceptedTokens The list of ERC20 tokens addresses accepted for payments and refunds
   * @param maxRateTimespan The the maximum span between the time the rate was fetched and the payment
   */
  constructor(
    private requestCurrency: RequestLogicTypes.ICurrency,
    private paymentReference: string,
    private conversionProxyContractAddress: string,
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
      contractAddress: this.conversionProxyContractAddress,
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      acceptedTokens: this.acceptedTokens,
      maxRateTimespan: this.maxRateTimespan,
    };
    // Parses, filters and creates the events from the logs with the payment reference
    const events = await this.client.GetConversionPayments(variables);
    // Creates the balance events
    return events.payments.map((payment) => {
      const chainlinkDecimal = 8;
      const decimalPadding = chainlinkDecimal - new Currency(this.requestCurrency).getDecimals();
      const amountWithRightDecimal = BigNumber.from(payment.amount)
        .div(10 ** decimalPadding)
        .toString();
      const feeAmountWithRightDecimal = payment.feeAmount
        ? BigNumber.from(payment.feeAmount)
            .div(10 ** decimalPadding)
            .toString()
        : undefined;

      return {
        amount: amountWithRightDecimal,
        name: this.eventName,
        parameters: {
          block: payment.block,
          feeAddress: payment.feeAddress ? utils.getAddress(payment.feeAddress) : undefined,
          feeAmount: feeAmountWithRightDecimal,
          feeAmountInCrypto: payment.feeAmountInCrypto || undefined,
          amountInCrypto: payment.amountInCrypto,
          tokenAddress: utils.getAddress(payment.tokenAddress),
          to: utils.getAddress(this.toAddress),
          from: utils.getAddress(payment.from),
          txHash: payment.txHash,
          gasUsed: payment.gasUsed,
          gasPrice: payment.gasPrice,
          maxRateTimespan: payment.maxRateTimespan?.toString(),
        },
        timestamp: payment.timestamp,
      };
    });
  }
}

export default TheGraphAnyToErc20Retriever;
