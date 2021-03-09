import { getDecimalsForCurrency, getCurrencyHash } from '@requestnetwork/currency';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';

// The conversion proxy smart contract ABI fragment containing TransferWithConversionAndReference event
const erc20ConversionProxyContractAbiFragment = [
  'event TransferWithConversionAndReference(uint256 amount, address currency, bytes indexed paymentReference, uint256 feeAmount, uint256 maxRateTimespan)',
];

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc20FeeProxyContractAbiFragment = [
  'event TransferWithReferenceAndFee(address tokenAddress, address to,uint256 amount,bytes indexed paymentReference,uint256 feeAmount,address feeAddress)',
];

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export default class ProxyERC20InfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  public contractConversionProxy: ethers.Contract;
  public contractERC20FeeProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param conversionProxyContractAddress The address of the proxy contract
   * @param conversionProxyCreationBlockNumber The block that created the proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private requestCurrency: RequestLogicTypes.ICurrency,
    private paymentReference: string,
    private conversionProxyContractAddress: string,
    private conversionProxyCreationBlockNumber: number,
    private erc20FeeProxyContractAddress: string,
    private erc20FeeProxyCreationBlockNumber: number,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private acceptedTokens?: string[],
    private maxRateTimespan: number = 0,
  ) {
    // Creates a local or default provider
    this.provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the conversion proxy contract interface
    this.contractConversionProxy = new ethers.Contract(
      this.conversionProxyContractAddress,
      erc20ConversionProxyContractAbiFragment,
      this.provider,
    );

    this.contractERC20FeeProxy = new ethers.Contract(
      this.erc20FeeProxyContractAddress,
      erc20FeeProxyContractAbiFragment,
      this.provider,
    );

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
    // Create a filter to find all the Fee Transfer logs with the payment reference
    const conversionFilter = this.contractConversionProxy.filters.TransferWithConversionAndReference(
      null,
      null,
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    conversionFilter.fromBlock = this.conversionProxyCreationBlockNumber;
    conversionFilter.toBlock = 'latest';

    // Get the fee proxy contract event logs
    const conversionLogs = await this.provider.getLogs(conversionFilter);

    // Create a filter to find all the Fee Transfer logs with the payment reference
    const feeFilter = this.contractERC20FeeProxy.filters.TransferWithReferenceAndFee(
      null,
      null,
      null,
      '0x' + this.paymentReference,
      null,
      null,
    ) as ethers.providers.Filter;
    feeFilter.fromBlock = this.erc20FeeProxyCreationBlockNumber;
    feeFilter.toBlock = 'latest';

    // Get the fee proxy contract event logs
    const feeLogs = await this.provider.getLogs(feeFilter);

    // Parses, filters and creates the events from the logs with the payment reference
    const eventPromises = conversionLogs
      // Parses the logs
      .map((log) => {
        const parsedConversionLog = this.contractConversionProxy.interface.parseLog(log);

        const proxyLog = feeLogs.find((l) => l.transactionHash === log.transactionHash);
        let parsedProxyLog;
        if (proxyLog) {
          parsedProxyLog = this.contractERC20FeeProxy.interface.parseLog(proxyLog);
        }
        return { parsedConversionLog, log, parsedProxyLog };
      })
      // Keeps only the log with the right token and the right destination address
      // With ethers v5, the criteria below can be added to the conversionFilter (PROT-1234)
      .filter(
        (log) =>
          // filter the token allowed
          (!this.acceptedTokens ||
            this.acceptedTokens.includes(log.parsedProxyLog!.values.tokenAddress.toLowerCase())) &&
          // check the rate timespan
          this.maxRateTimespan >= log.parsedConversionLog.values.maxRateTimespan.toNumber() &&
          // check the requestCurrency
          getCurrencyHash(this.requestCurrency).toLowerCase() ===
            log.parsedConversionLog.values.currency.toLowerCase() &&
          // check to address
          log.parsedProxyLog!.values.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // Creates the balance events
      .map(async (t) => {
        const chainlinkDecimal = 8;
        const decimalPadding = chainlinkDecimal - getDecimalsForCurrency(this.requestCurrency);

        const amountWithRightDecimal = ethers.utils
          .bigNumberify(t.parsedConversionLog.values.amount.toString())
          .div(10 ** decimalPadding)
          .toString();
        const feeAmountWithRightDecimal = ethers.utils
          .bigNumberify(t.parsedConversionLog.values.feeAmount.toString() || 0)
          .div(10 ** decimalPadding)
          .toString();

        return {
          amount: amountWithRightDecimal,
          name: this.eventName,
          parameters: {
            block: t.log.blockNumber,
            feeAddress: t.parsedProxyLog!.values.feeAddress || undefined,
            feeAmount: feeAmountWithRightDecimal,
            feeAmountInCrypto: t.parsedProxyLog?.values.amount.toString() || undefined,
            amountInCrypto: t.parsedProxyLog?.values.feeAmount.toString(),
            tokenAddress: t.parsedProxyLog!.values.tokenAddress,
            to: this.toAddress,
            txHash: t.log.transactionHash,
            maxRateTimespan: t.parsedConversionLog.values.maxRateTimespan.toString(),
          },
          timestamp: (await this.provider.getBlock(t.log.blockNumber || 0)).timestamp,
        };
      });

    return Promise.all(eventPromises);
  }
}
