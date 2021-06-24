import { Currency } from '@requestnetwork/currency';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, ethers } from 'ethers';
import { getDefaultProvider } from '../provider';
import { parseLogArgs, unpadAmountFromChainlink } from '../utils';

// The conversion proxy smart contract ABI fragment containing TransferWithConversionAndReference event
const erc20ConversionProxyContractAbiFragment = [
  'event TransferWithConversionAndReference(uint256 amount, address currency, bytes indexed paymentReference, uint256 feeAmount, uint256 maxRateTimespan)',
];

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc20FeeProxyContractAbiFragment = [
  'event TransferWithReferenceAndFee(address tokenAddress, address to,uint256 amount,bytes indexed paymentReference,uint256 feeAmount,address feeAddress)',
];

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
  tokenAddress: string;
  to: string;
  amount: BigNumber;
  paymentReference: string;
  feeAmount: BigNumber;
  feeAddress: string;
};
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
    this.provider = getDefaultProvider(this.network);

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
        if (!proxyLog) {
          throw new Error('proxy log not found');
        }
        const parsedProxyLog = this.contractERC20FeeProxy.interface.parseLog(proxyLog);
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
            this.acceptedTokens.includes(proxyLog.tokenAddress.toLowerCase())) &&
          // check the rate timespan
          this.maxRateTimespan >= conversionLog.maxRateTimespan.toNumber() &&
          // check the requestCurrency
          new Currency(this.requestCurrency).getHash().toLowerCase() ===
            conversionLog.currency.toLowerCase() &&
          // check to address
          proxyLog.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // Creates the balance events
      .map(async ({ conversionLog, proxyLog, blockNumber, transactionHash }) => {
        const requestCurrency = new Currency(this.requestCurrency);

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
}
