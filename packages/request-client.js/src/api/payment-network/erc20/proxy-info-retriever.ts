import { ethers } from 'ethers';

import * as Types from '../../../types';

const bigNumber: any = require('bn.js');

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc20proxyContractAbiFragment = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'bytes',
        name: 'transferReference',
        type: 'bytes',
      },
    ],
    name: 'TransferWithReference',
    type: 'event',
  },
];

/**
 * Gets a list of transfer events for an address
 *
 * @param tokenContractAddress The address of the ERC20 contract
 * @param address Address of the balance we want to check
 * @param network The Ethereum network to use
 */
async function getTransferEvents(
  eventName: Types.EVENTS_NAMES,
  tokenContractAddress: string,
  requestId: string,
  toAddress: string,
  network: string,
  proxyContractAddress: string,
): Promise<Types.IBalanceWithEvents> {
  // Connect to the network
  const provider = ethers.getDefaultProvider(network);

  // Setup the ERC20 contract interface
  const contract = new ethers.Contract(
    proxyContractAddress,
    erc20proxyContractAbiFragment,
    provider,
  );

  // Create a filter to find all the Transfer logs for the toAddress
  const filter = contract.filters.RequestTransfer(
    null,
    toAddress,
    null,
    '0x' + requestId,
  ) as ethers.providers.Filter;
  filter.fromBlock = 0;
  filter.toBlock = 'latest';

  // Get the event logs
  const logs = await provider.getLogs(filter);

  // Clean up the Transfer logs data
  const eventsPromise = logs
    .map(log => {
      const parsedLog = contract.interface.parseLog(log);
      return { parsedLog, log };
    })
    .filter(
      log => log.parsedLog.values.tokenAddress.toLowerCase() === tokenContractAddress.toLowerCase(),
    )
    .map(async t => ({
      amount: t.parsedLog.values.amount.toString(),
      name: eventName,
      parameters: {
        block: t.log.blockNumber,
        txHash: t.log.transactionHash,
      },
      timestamp: (await provider.getBlock(t.log.blockNumber || 0)).timestamp,
    }));

  const events = await Promise.all(eventsPromise);

  const balance = events.reduce((balanceTempStr, event) => {
    const balanceTemp = new bigNumber(balanceTempStr);
    const amount = new bigNumber(event.amount);
    return balanceTemp.add(amount).toString();
  }, '0');

  return { balance, events };
}

export default getTransferEvents;
