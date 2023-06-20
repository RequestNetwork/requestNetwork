/* eslint-disable import/no-extraneous-dependencies */
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import yargs from 'yargs';
import { createPublicClient, getAddress, http, defineChain, Chain } from 'viem';
import * as chains from '@wagmi/chains';

const erc20Abi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type IOptions = {
  address: string;
  network: string;
  skipUpgrade: boolean;
};

const handler = async ({ address, network, skipUpgrade }: IOptions) => {
  const spinner = ora('Initializing...').start();
  if (!skipUpgrade) {
    spinner.text = 'upgrading @metamask/contract-metadata';
    await promisify(exec)('yarn add @metamask/contract-metadata --exact');
  }

  spinner.text = 'Fetch contract metadata';

  const checksumAddress = getAddress(address);

  // check if the token exists in the list
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const metamaskContractMap = require('@metamask/contract-metadata');
  if (metamaskContractMap[checksumAddress]) {
    console.log(`This token is already listed on @metamask/contract-metadata`);
    return;
  }

  if (network in chains) {
    const client = createPublicClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chain: defineChain((chains as any)[network]) as Chain,
      transport: http()
    })
    const decimals = await client.readContract({ address: checksumAddress, abi: erc20Abi, functionName: "decimals" });
    const symbol = await client.readContract({ address: checksumAddress, abi: erc20Abi, functionName: "symbol" });
    const name = await client.readContract({ address: checksumAddress, abi: erc20Abi, functionName: "name" });


    spinner.stop();

    console.log(
      JSON.stringify(
        {
          [checksumAddress]: {
            name,
            symbol,
            decimals,
          },
        },
        null,
        2,
      ),
    );
  }
};

void yargs(process.argv.slice(2)).command<IOptions>(
  '$0 [address]',
  'Fetch info about the desired ERC20 token, for the given network',
  (builder) => {
    return builder
      .positional('address', {
        describe: 'The token address',
        type: 'string',
      })
      .option('network', {
        describe: 'The network of the token (mainnet, rinkeby, matic...)',
        default: 'mainnet',
      })
      .option('skipUpgrade', {
        describe: 'Skips the @metamask/contract-metadata upgrade',
        default: false,
        type: 'boolean',
      })
      .demandOption('address');
  },
  handler,
).argv;
