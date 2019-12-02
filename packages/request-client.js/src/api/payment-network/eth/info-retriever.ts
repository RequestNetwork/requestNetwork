import { ethers } from 'ethers';
import * as Types from '../../../types';

/**
 * Gets a list of transfer events for an address and payment reference
 *
 * @param address Address to check
 * @param eventName Indicate if it is an address for payment or refund
 * @param network The id of network we want to check
 * @param paymentReference The reference to identify the payment
 * @param etherscanApiToken The etherscan API token
 */
async function getTransferEvents(
  toAddress: string,
  eventName: Types.EVENTS_NAMES,
  network: string,
  paymentReference: string,
  etherscanApiKey?: string,
): Promise<{
  events: Array<{
    name: Types.EVENTS_NAMES;
    parameters: {
      amount: string;
      block?: number;
      confirmation?: number;
      timestamp?: number;
      txHash?: string;
    };
  }>;
}> {
  if (network === 'private') {
    throw new Error(
      'ETH input data info-retriever works with etherscan and cannot work on a local network',
    );
  }
  const provider = new ethers.providers.EtherscanProvider(network, etherscanApiKey);
  const history = await provider.getHistory(toAddress);

  const events = history
    // keep only when address is the destination
    .filter(
      transaction => transaction.to && transaction.to.toLowerCase() === toAddress.toLowerCase(),
    )
    // keep only if data contains the payment reference
    .filter(transaction => transaction.data.toLowerCase() === '0x' + paymentReference.toLowerCase())
    .map(transaction => ({
      name: eventName,
      parameters: {
        amount: transaction.value.toString(),
        block: transaction.blockNumber,
        confirmations: transaction.confirmations,
        timestamp: transaction.timestamp,
        txHash: transaction.hash,
      },
    }));

  return { events };
}

export default getTransferEvents;
