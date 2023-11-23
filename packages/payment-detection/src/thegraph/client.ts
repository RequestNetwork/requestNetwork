/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';
import { pick } from 'lodash';

const HOSTED_THE_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-';

const THE_GRAPH_URL_MANTLE_TESTNET =
  'https://graph.testnet.mantle.xyz/subgraphs/name/requestnetwork/request-payments-mantle-testnet';

const THE_GRAPH_URL_MANTLE =
  'https://graph.fusionx.finance/subgraphs/name/requestnetwork/request-payments-mantle';

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Request's subgraph.
 *
 * @type TGraphClientVariant: null if no variant, 'near' if native token payments detection on Near
 */
export type TheGraphClient<TChain extends CurrencyTypes.VMChainName = CurrencyTypes.EvmChainName> =
  (TChain extends CurrencyTypes.NearChainName
    ? ReturnType<typeof getNearSdk>
    : ReturnType<typeof getSdk>) & {
    options?: TheGraphClientOptions;
  };

export type TheGraphClientOptions = {
  timeout?: number;
  /** constraint to select indexers that have at least parsed this block */
  minIndexedBlock?: number | undefined;
};

const extractClientOptions = (options?: TheGraphClientOptions) => {
  return pick(options, 'timeout');
};

export const getTheGraphEvmClient = (url: string, options?: TheGraphClientOptions) => {
  const sdk: TheGraphClient<CurrencyTypes.EvmChainName> = getSdk(
    new GraphQLClient(url, extractClientOptions(options)),
  );
  sdk.options = options;
  return sdk;
};

export const getTheGraphNearClient = (url: string, options?: TheGraphClientOptions) => {
  const sdk: TheGraphClient<CurrencyTypes.NearChainName> = getNearSdk(
    new GraphQLClient(url, extractClientOptions(options)),
  );
  sdk.options = options;
  return sdk;
};

export const defaultGetTheGraphClient = (
  network: CurrencyTypes.ChainName,
  options?: TheGraphClientOptions,
) => {
  return network === 'private'
    ? undefined
    : NearChains.isChainSupported(network)
    ? getTheGraphNearClient(`${HOSTED_THE_GRAPH_URL}${network.replace('aurora', 'near')}`, options)
    : network === 'mantle'
    ? getTheGraphEvmClient(THE_GRAPH_URL_MANTLE, options)
    : network === 'mantle-testnet'
    ? getTheGraphEvmClient(THE_GRAPH_URL_MANTLE_TESTNET, options)
    : getTheGraphEvmClient(`${HOSTED_THE_GRAPH_URL}${network}`, options);
};
