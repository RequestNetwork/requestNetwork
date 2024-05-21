/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { Block_Height, Maybe, getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';
import { RequestConfig } from 'graphql-request/src/types';

const THE_GRAPH_STUDIO_URL =
  'https://api.studio.thegraph.com/query/67444/request-payments-$NETWORK/version/latest';

const THE_GRAPH_STUDIO_URL_RF =
  'https://api.studio.thegraph.com/query/35843/request-payments-$NETWORK/version/latest';

const THE_GRAPH_URL_MANTLE_TESTNET =
  'https://graph.testnet.mantle.xyz/subgraphs/name/requestnetwork/request-payments-mantle-testnet';

const THE_GRAPH_URL_MANTLE =
  'https://graph.fusionx.finance/subgraphs/name/requestnetwork/request-payments-mantle';

const THE_GRAPH_URL_CORE =
  'https://thegraph.coredao.org/subgraphs/name/requestnetwork/request-payments-core';

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
    // the decentralized network doesn't support "undefined"
    queryOptions.blockFilter = { number_gte: 0 };
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
  const sdk: TheGraphClient<CurrencyTypes.EvmChainName> = getSdk(
    new GraphQLClient(url, clientOptions),
  );
  sdk.options = queryOptions;
  return sdk;
};

export const getTheGraphNearClient = (url: string, options?: TheGraphClientOptions) => {
  const [clientOptions, queryOptions] = extractClientOptions(url, options);
  const sdk: TheGraphClient<CurrencyTypes.NearChainName> = getNearSdk(
    new GraphQLClient(url, clientOptions),
  );
  sdk.options = queryOptions;
  return sdk;
};

export const defaultGetTheGraphClient = (
  network: CurrencyTypes.ChainName,
  options?: TheGraphClientOptions,
) => {
  return network === 'private'
    ? undefined
    : NearChains.isChainSupported(network)
    ? getTheGraphNearClient(
        `${THE_GRAPH_STUDIO_URL.replace('$NETWORK', network.replace('aurora', 'near'))}`,
        options,
      )
    : network === 'mantle'
    ? getTheGraphEvmClient(THE_GRAPH_URL_MANTLE, options)
    : network === 'mantle-testnet'
    ? getTheGraphEvmClient(THE_GRAPH_URL_MANTLE_TESTNET, options)
    : network === 'core'
    ? getTheGraphEvmClient(THE_GRAPH_URL_CORE, options)
    : /**
     * These two subgraphs could not be transferred from the RF Studio account to the RN Studio account,
     * because of an issue with TheGraph Studio and the fact that they were created before the
     * migration to TheGraph decentralized network based on Arbitrum.
     * FIXME: transfer these two subgraphs to the RN Studio account
     */
    ['mainnet', 'xdai'].includes(network)
    ? getTheGraphEvmClient(`${THE_GRAPH_STUDIO_URL_RF.replace('$NETWORK', network)}`, options)
    : getTheGraphEvmClient(`${THE_GRAPH_STUDIO_URL.replace('$NETWORK', network)}`, options);
};
