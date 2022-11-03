import { utils, Wallet } from 'ethers';
import inquirer from 'inquirer';
import { getDefaultProvider } from '@requestnetwork/payment-detection';
import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { ChainlinkConversionPath } from '@requestnetwork/smart-contracts/types';

export const runUpdate = async <T extends 'updateAggregator' | 'updateAggregatorsList'>(
  method: T,
  params: Parameters<ChainlinkConversionPath['functions'][T]>,
  args: SharedOptions,
): Promise<void> => {
  const contractsWithVersion = connectChainlinkContracts(args);
  const dryRunText = args.dryRun ? '[dry-run] ' : '';

  for (const { version, contract } of contractsWithVersion) {
    console.log(
      `${dryRunText} will call ${method} on chainlinkConversionPath version ${version} at ${contract.address} (${args.network}))`,
    );
    console.log(JSON.stringify(params));
    if (args.dryRun) {
      process.exit();
    }
    // TS hack to fix params type
    const neverParams = params as [never, never, never];

    try {
      const gas = await contract.estimateGas[method](...neverParams);
      console.log(`Gas Estimation: ${utils.formatUnits(gas, 'gwei')} gwei`);
    } catch (e) {
      console.log('Cannot estimate gas');
    }
    const { proceed } = await inquirer.prompt([
      { name: 'proceed', type: 'confirm', message: 'Proceed?' },
    ]);
    if (!proceed) {
      process.exit();
    }

    const tx = await contract.functions[method](...neverParams);
    console.log(`Transaction: ${tx.hash}`);
  }
};

export type SharedOptions = {
  privateKey?: string;
  mnemonic?: string;
  dryRun?: boolean;
  network: string;
};

type ChainlinkContractWithVersion = {
  version: string;
  contract: ChainlinkConversionPath;
};

const connectChainlinkContracts = ({
  privateKey,
  mnemonic,
  dryRun,
  network,
}: SharedOptions): ChainlinkContractWithVersion[] => {
  const provider = getDefaultProvider(network);

  const wallet = privateKey
    ? new Wallet(privateKey).connect(provider as any) // TODO
    : mnemonic
    ? Wallet.fromMnemonic(mnemonic).connect(provider as any) // TODO
    : dryRun
    ? Wallet.createRandom()
    : undefined;

  if (!wallet) {
    throw new Error('one of mnemonic or privateKey is mandatory when dryRun is false');
  }
  const versions = chainlinkConversionPath
    .getAllAddresses(network)
    .filter((x) => !!x.address)
    .map((x) => x.version);

  return versions.map((version) => {
    return {
      version,
      contract: chainlinkConversionPath.connect(network, wallet as any, version) as any, // TODO}
    };
  });
};
