/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDefaultProvider } from '@requestnetwork/payment-detection';
import ora from 'ora';
import yargs from 'yargs';

const erc20Abi = [
  // Read-Only Functions
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

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

  const checksumAddress = ethers.utils.getAddress(address);

  // check if the token exists in the list
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const metamaskContractMap = require('@metamask/contract-metadata');
  if (metamaskContractMap[checksumAddress]) {
    console.log(`This token is already listed on @metamask/contract-metadata`);
    return;
  }

  const provider = getDefaultProvider(network);
  const erc20 = new ethers.Contract(address, erc20Abi, provider);

  const decimals = await erc20.decimals();
  const symbol = await erc20.symbol();
  const name = await erc20.name();

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
};

yargs(process.argv.slice(2)).command<IOptions>(
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
