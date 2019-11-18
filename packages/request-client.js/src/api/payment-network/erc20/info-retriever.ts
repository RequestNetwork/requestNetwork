import { ethers } from 'ethers';

const bigNumber: any = require('bn.js');

// The ERC20 smart contract ABI fragment containing decimals property and Transfer event
const erc20BalanceOfAbiFragment = [
  // decimals property
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  // Transfer events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
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
  tokenContractAddress: string,
  toAddress: string,
  network: string,
): Promise<{
  decimals: string;
  tokenEvents: Array<{ from: string; to: string; value: string }>;
}> {
  // Creates a local or default provider
  const provider =
    network === 'private'
      ? new ethers.providers.JsonRpcProvider()
      : ethers.getDefaultProvider(network);

  // Setup the ERC20 contract interface
  const contract = new ethers.Contract(tokenContractAddress, erc20BalanceOfAbiFragment, provider);

  // Get the amount of decimals for the ERC20
  const decimals = new bigNumber(await contract.decimals()).toString();

  // Create a filter to find all the Transfer logs for the toAddress
  const filter = contract.filters.Transfer(null, toAddress) as ethers.providers.Filter;
  filter.fromBlock = 0;
  filter.toBlock = 'latest';

  // Get the event logs
  const logs = await provider.getLogs(filter);

  // Clean up the Transfer logs data
  const tokenEvents = logs.map(log => {
    const parsedLog = contract.interface.parseLog(log);
    return {
      from: parsedLog.values.from,
      to: parsedLog.values.to,
      value: parsedLog.values.value.toString(),
    };
  });

  return {
    decimals,
    tokenEvents,
  };
}

export default getTransferEvents;

/**
 * Returns the amount of decimals for an ERC20 token
 *
 * @param tokenContractAddress The ERC20 contract address
 * @param network The ERC20 contract network
 * @returns The number of decimals
 */
export async function getDecimals(tokenContractAddress: string, network: string): Promise<number> {
  // Connect to the network
  const provider =
    network === 'private'
      ? new ethers.providers.JsonRpcProvider()
      : ethers.getDefaultProvider(network);
  // Setup the ERC20 contract interface
  const contract = new ethers.Contract(tokenContractAddress, erc20BalanceOfAbiFragment, provider);
  // Returns the amount of decimals for the ERC20
  return new bigNumber(await contract.decimals()).toNumber();
}
