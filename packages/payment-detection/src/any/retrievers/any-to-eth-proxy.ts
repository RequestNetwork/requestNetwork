import { ConversionInfoRetriever } from './any-to-any-proxy';
import { ethers } from 'ethers';

/**
 * Retrieves a list of payment events from a payment reference, a destination address and a proxy contract
 */
export class AnyToEthInfoRetriever extends ConversionInfoRetriever {
  protected getFeeFilter(): ethers.providers.Filter {
    // Create a filter to find all the Fee Transfer logs with the payment reference
    const feeFilter = this.contractConversionProxy.filters.TransferWithReferenceAndFee(
      null,
      null,
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    feeFilter.fromBlock = this.conversionProxyCreationBlockNumber;
    feeFilter.toBlock = 'latest';
    return feeFilter;
  }
}
