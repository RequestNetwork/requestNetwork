import { PaymentTypes } from '@requestnetwork/types';

import BlockchainInfo from './default-providers/blockchain-info';
import BlockcypherCom from './default-providers/blockcypher-com';
import BlockstreamInfo from './default-providers/blockstream-info';
import ChainSo from './default-providers/chain-so';

/**
 * The default Bitcoin detection provider give access to the bitcoin blockchain through several external API's
 */
export default class DefaultBitcoinDetectionProvider
  implements PaymentTypes.IBitcoinDetectionProvider {
  public providers: PaymentTypes.IBitcoinDetectionProvider[];

  /**
   * Creates an instance of DefaultBitcoinDetectionProvider
   */
  constructor() {
    this.providers = [
      new BlockchainInfo(),
      new BlockstreamInfo(),
      new ChainSo(),
      new BlockcypherCom(),
    ];
  }

  /**
   * Gets BTC address balance with events
   *
   * @param bitcoinNetworkId The Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @param address BTC address to check
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Object containing address info
   */
  public async getAddressBalanceWithEvents(
    bitcoinNetworkId: number,
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): Promise<PaymentTypes.BTCBalanceWithEvents> {
    if (this.providers.length < 2) {
      throw new Error('At least two bitcoin providers are needed');
    }
    let providerUsedIndex = 0;
    let infoFromProviders = [];

    // The two first calls to the providers
    infoFromProviders = await Promise.all([
      this.providers[providerUsedIndex++].getAddressBalanceWithEvents(
        bitcoinNetworkId,
        address,
        eventName,
      ),
      this.providers[providerUsedIndex++].getAddressBalanceWithEvents(
        bitcoinNetworkId,
        address,
        eventName,
      ),
    ]);

    let mostCommon = this.getMostCommonBalance(infoFromProviders);
    // while there are not two identical balances, we try to get the information from another provider
    while ((!mostCommon || mostCommon.count < 2) && providerUsedIndex < this.providers.length) {
      infoFromProviders.push(
        await this.providers[providerUsedIndex++].getAddressBalanceWithEvents(
          bitcoinNetworkId,
          address,
          eventName,
        ),
      );
      mostCommon = this.getMostCommonBalance(infoFromProviders);
    }

    // If there are two identical balances we return it
    if (mostCommon && mostCommon.count >= 2) {
      return mostCommon.value;
    }

    throw new Error('Error getting the balance from the bitcoin providers');
  }

  /**
   * Get the balance and events the most common in an array
   *
   * @param array array to count
   * @returns Object containing IBalanceWithEvents and the count
   */
  private getMostCommonBalance(
    array: PaymentTypes.BTCBalanceWithEvents[],
  ): { count: number; value: PaymentTypes.BTCBalanceWithEvents } | undefined {
    // Reduce the array to an object indexed by balance with the count
    const duplicatesWithCount: {
      [key: string]: { count: number; value: PaymentTypes.BTCBalanceWithEvents };
    } = array
      .filter(info => info.balance !== '-1')
      .reduce(
        (
          accumulator: {
            [key: string]: { count: number; value: PaymentTypes.BTCBalanceWithEvents };
          },
          elem: PaymentTypes.BTCBalanceWithEvents,
        ) => {
          if (elem.balance !== null) {
            if (!accumulator[elem.balance]) {
              accumulator[elem.balance] = { count: 0, value: elem };
            }
            accumulator[elem.balance].count++;
          }
          return accumulator;
        },
        {},
      );

    // Sort the array by the count
    const sortedArray = Object.values(duplicatesWithCount).sort(
      (a: any, b: any) => b.count - a.count,
    );

    // Get the first element
    return sortedArray[0];
  }
}
