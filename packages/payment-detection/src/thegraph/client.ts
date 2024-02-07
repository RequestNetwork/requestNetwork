/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { Block_Height, Maybe, getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';
import { RequestConfig } from 'graphql-request/src/types';

const HOSTED_THE_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-';

const THE_GRAPH_URL_MANTLE_TESTNET =
  'https://graph.testnet.mantle.xyz/subgraphs/name/requestnetwork/request-payments-mantle-testnet';

const THE_GRAPH_URL_MANTLE =
  'https://graph.fusionx.finance/subgraphs/name/requestnetwork/request-payments-mantle';

const THE_GRAPH_URL_STUDIO_ZKSYNC =
  'https://api.studio.thegraph.com/query/35843/request-payment-zksyncera/version/latest';

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.

/**
 * A GraphQL client to query Request's subgraph.
 *
 * @type TGraphClientVariant: null if no variant, 'near' if native token payments detection on Near
 */
export type TheGraphClient<TChain extends ChainTypes.VMChain = ChainTypes.IEvmChain> =
  (TChain extends ChainTypes.INearChain
    ? ReturnType<typeof getNearSdk>
    : ReturnType<typeof getSdk>) & {
    options?: TheGraphQueryOptions;
  };

export type TheGraphQueryOptions = {
  blockFilter?: Maybe<Block_Height>;
};

export type TheGraphClientOptions = RequestConfig & {
  /** constraint to select indexers that have at least parsed this block */
  minIndexedBlock?: number | undefined;
};

/** Splits the input options into "client options" to pass to the SDK, and "query options" to use in queries */
const extractClientOptions = (
  url: string,
  options?: TheGraphClientOptions,
): [RequestConfig, TheGraphQueryOptions] => {
  const optionsObject = options ?? {};

  // build query options
  const queryOptions: TheGraphQueryOptions = {};
  const { minIndexedBlock, ...clientOptions } = optionsObject;
  if (minIndexedBlock) {
    queryOptions.blockFilter = { number_gte: minIndexedBlock };
  } else if (url.match(/^https:\/\/gateway-\w+\.network\.thegraph\.com\//)) {
    // the decentralized network expects an empty object, and doesn't support "undefined"
    queryOptions.blockFilter = {};
  }

  // build client options
  return [clientOptions, queryOptions];
};

export const getTheGraphClient = (network: string, url: string, options?: TheGraphClientOptions) =>
  NearChains.isChainSupported(network)
    ? getTheGraphNearClient(url, options)
    : getTheGraphEvmClient(url, options);

export const getTheGraphEvmClient = (url: string, options?: TheGraphClientOptions) => {
  const [clientOptions, queryOptions] = extractClientOptions(url, options);
  const sdk: TheGraphClient<ChainTypes.IEvmChain> = getSdk(new GraphQLClient(url, clientOptions));
  sdk.options = queryOptions;
  return sdk;
};

export const getTheGraphNearClient = (url: string, options?: TheGraphClientOptions) => {
  const [clientOptions, queryOptions] = extractClientOptions(url, options);
  const sdk: TheGraphClient<ChainTypes.INearChain> = getNearSdk(
    new GraphQLClient(url, clientOptions),
  );
  sdk.options = queryOptions;
  return sdk;
};

export const defaultGetTheGraphClient = (
  network: ChainTypes.IChain,
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
    : network === 'zksyncera'
    ? getTheGraphEvmClient(THE_GRAPH_URL_STUDIO_ZKSYNC, options)
    : getTheGraphEvmClient(`${HOSTED_THE_GRAPH_URL}${network}`, options);
};
