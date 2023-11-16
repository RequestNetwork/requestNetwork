import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { BigNumber, ethers } from 'ethers';
import { parseLogArgs, unpadAmountFromChainlink } from '../../utils';
import type { JsonFragment } from '@ethersproject/abi';
import { getDefaultProvider } from '@requestnetwork/utils';

/** TransferWithConversionAndReference event */
type TransferWithConversionAndReferenceArgs = {
  amount: BigNumber;
  currency: string;
  paymentReference: string;
  feeAmount: BigNumber;
  maxRateTimespan: BigNumber;
};

/** TransferWithReferenceAndFee event */
type TransferWithReferenceAndFeeArgs = {
  tokenAddress?: string;
  to: string;
  amount: BigNumber;
  paymentReference: string;
  feeAmount: BigNumber;
  feeAddress: string;
};

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export abstract class ConversionInfoRetriever {
  public contractConversionProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param conversionProxyContractAddress The address of the conversion proxy contract
   * @param conversionProxyCreationBlockNumber The block that created the conversion proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    protected requestCurrency: CurrencyTypes.CurrencyDefinition,
    protected paymentReference: string,
    protected conversionProxyContractAddress: string,
    protected conversionProxyCreationBlockNumber: number,
    protected conversionProxyContractAbiFragment: JsonFragment[],
    protected toAddress: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    protected network: string,
    protected acceptedTokens?: string[],
    protected maxRateTimespan: number = 0,
  ) {
    // Creates a local or default provider
    this.provider = getDefaultProvider(this.network);

    // Setup the conversion proxy contract interface
    this.contractConversionProxy = new ethers.Contract(
      this.conversionProxyContractAddress,
      this.conversionProxyContractAbiFragment,
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
  public async getTransferEvents(): Promise<PaymentTypes.ConversionPaymentNetworkEvent[]> {
    // Create a filter to find all the Fee Transfer logs with the payment reference
    const conversionFilter =
      this.contractConversionProxy.filters.TransferWithConversionAndReference(
        null,
        null,
        '0x' + this.paymentReference,
        null,
        null,
      ) as ethers.providers.Filter;
    conversionFilter.fromBlock = this.conversionProxyCreationBlockNumber;
    conversionFilter.toBlock = 'latest';

    // Get the conversion contract event logs
    const conversionLogs = await this.provider.getLogs(conversionFilter);

    // Create a filter to find all the Fee Transfer logs with the payment reference
    const feeFilter = this.getFeeFilter();

    // Get the fee proxy contract event logs
    const feeProxyLogs = await this.provider.getLogs(feeFilter);

    // Parses, filters and creates the events from the logs with the payment reference
    const eventPromises = conversionLogs
      // Parses the logs
      .map((log) => {
        const parsedConversionLog = this.contractConversionProxy.interface.parseLog(log);
        const proxyLog = feeProxyLogs.find((l) => l.transactionHash === log.transactionHash);
        if (!proxyLog) {
          throw new Error('proxy log not found');
        }
        const parsedProxyLog = this.contractConversionProxy.interface.parseLog(proxyLog);
        return {
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          conversionLog: parseLogArgs<TransferWithConversionAndReferenceArgs>(parsedConversionLog),
          proxyLog: parseLogArgs<TransferWithReferenceAndFeeArgs>(parsedProxyLog),
        };
      })
      // Keeps only the log with the right token and the right destination address
      // With ethers v5, the criteria below can be added to the conversionFilter (PROT-1234)
      .filter(
        ({ conversionLog, proxyLog }) =>
          // filter the token allowed
          (!this.acceptedTokens ||
            !proxyLog.tokenAddress ||
            this.acceptedTokens.includes(proxyLog.tokenAddress.toLowerCase())) &&
          // check the rate timespan
          this.maxRateTimespan >= conversionLog.maxRateTimespan.toNumber() &&
          // check the requestCurrency
          this.requestCurrency.hash.toLowerCase() === conversionLog.currency.toLowerCase() &&
          // check to address
          proxyLog.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // Creates the balance events
      .map(async ({ conversionLog, proxyLog, blockNumber, transactionHash }) => {
        const requestCurrency = this.requestCurrency;

        const amount = unpadAmountFromChainlink(conversionLog.amount, requestCurrency).toString();
        const feeAmount = unpadAmountFromChainlink(
          conversionLog.feeAmount,
          requestCurrency,
        ).toString();

        return {
          amount,
          name: this.eventName,
          parameters: {
            block: blockNumber,
            feeAddress: proxyLog.feeAddress || undefined,
            feeAmount,
            feeAmountInCrypto: proxyLog.feeAmount.toString() || undefined,
            amountInCrypto: proxyLog.amount.toString(),
            tokenAddress: proxyLog.tokenAddress,
            to: this.toAddress,
            txHash: transactionHash,
            maxRateTimespan: conversionLog.maxRateTimespan.toString(),
          },
          timestamp: (await this.provider.getBlock(blockNumber || 0)).timestamp,
        };
      });

    return Promise.all(eventPromises);
  }

  protected abstract getFeeFilter(): ethers.providers.Filter;
}
