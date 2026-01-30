/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { Block_Height, getSdk, Maybe } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';

const THE_GRAPH_STUDIO_URL =
  'https://api.studio.thegraph.com/query/67444/request-payments-$NETWORK/version/latest';

const THE_GRAPH_EXPLORER_URL =
  'https://gateway.thegraph.com/api/$API_KEY/subgraphs/id/$SUBGRAPH_ID';

const THE_GRAPH_URL_MANTLE_TESTNET =
  'https://graph.testnet.mantle.xyz/subgraphs/name/requestnetwork/request-payments-mantle-testnet';

const THE_GRAPH_URL_MANTLE =
  'https://subgraph-api.mantle.xyz/api/public/555176e7-c1f4-49f9-9180-f2f03538b039/subgraphs/requestnetwork/request-payments-mantle/v0.1.0/gn';

const THE_GRAPH_URL_CORE =
  'https://thegraph.coredao.org/subgraphs/name/requestnetwork/request-payments-core';

const THE_GRAPH_EXPLORER_SUBGRAPH_ID: Partial<Record<CurrencyTypes.ChainName, string>> = {
  ['arbitrum-one']: '3MtDdHbzvBVNBpzUTYXGuDDLgTd1b8bPYwoH1Hdssgp9',
  avalanche: 'A27V4PeZdKHeyuBkehdBJN8cxNtzVpXvYoqkjHUHRCFp',
  base: 'CcTtKy6BustyyVZ5XvFD4nLnbkgMBT1vcAEJ3sAx6bRe',
  bsc: '4PScFUi3CFDbop9XzT6gCDtD4RR8kRzyrzSjrHoXHZBt',
  celo: '5ts3PHjMcH2skCgKtvLLNE64WLjbhE5ipruvEcgqyZqC',
  fantom: '6AwmiYo5eY36W526ZDQeAkNBjXjXKYcMLYyYHeM67xAb',
  fuse: 'EHSpUBa7PAewX7WsaU2jbCKowF5it56yStr6Zgf8aDtx',
  mainnet: '5mXPGZRC2Caynh4NyVrTK72DAGB9dfcKmLsnxYWHQ9nd',
  matic: 'DPpU1WMxk2Z4H2TAqgwGbVBGpabjbC1972Mynak5jSuR',
  moonbeam: '4Jo3DwA25zyVLeDhyi7cks52dNrkVCWWhQJzm1hKnCfj',
  sepolia: '6e8Dcwt3cvsgNU3JYBtRQQ9Sj4P9VVVnXaPjJ3jUpYpY',
  sonic: 'CQbtmuANYsChysuXTk9jWP3BD4ArncARVVw1b8JpHiTk',
  near: '9yEg3h46CZiv4VuSqo1erMMBx5sHxRuW5Ai2V8goSpQL',
  ['near-testnet']: 'AusVyfndonsMVFrVzckuENLqx8t6kcXuxn6C6VbSGd7M',
  optimism: '525fra79nG3Z1w8aPZh3nHsH5zCVetrVmceB1hKcTrTX',
  xdai: '2UAW7B94eeeqaL5qUM5FDzTWJcmgA6ta1RcWMo3XuLmU',
  zksyncera: 'HJNZW9vRSGXrcCVyQMdNKxxuLKeZcV6yMjTCyY6T2oon',
};

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

type RequestConfig = (typeof GraphQLClient.prototype)['requestConfig'];

export type TheGraphClientOptions = RequestConfig & {
  /** constraint to select indexers that have at least parsed this block */
  minIndexedBlock?: number | undefined;
  /** API key for accessing subgraphs hosted on TheGraph Explorer */
  theGraphExplorerApiKey?: string;
  /** URL to access the subgraph. Using this option will ignore theGraphExplorerApiKey */
  url?: string;
};

/** Splits the input options into "client options" to pass to the SDK, and "query options" to use in queries */
const extractClientOptions = (
  url: string,
  options?: TheGraphClientOptions,
): [RequestConfig, TheGraphQueryOptions] => {
  const optionsObject = options ?? {};

  // build query options
  const queryOptions: TheGraphQueryOptions = {};
  const {
    minIndexedBlock,
    // ignore theGraphExplorerApiKey, it should not be part of clientOptions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    theGraphExplorerApiKey: _theGraphExplorerApiKey,
    ...clientOptions
  } = optionsObject;
  if (minIndexedBlock) {
    queryOptions.blockFilter = { number_gte: minIndexedBlock };
  } else if (url.match(/^https:\/\/gateway-\w+\.network\.thegraph\.com\//)) {
    // the decentralized network doesn't support "undefined"
    queryOptions.blockFilter = { number_gte: 0 };
  }

  // build client options
  return [clientOptions, queryOptions];
};

export const getTheGraphClient = (
  network: CurrencyTypes.ChainName,
  options?: TheGraphClientOptions,
) => {
  const url = getTheGraphClientUrl(network, options);
  if (!url) return;
  return NearChains.isChainSupported(network)
    ? getTheGraphNearClient(url, options)
    : getTheGraphEvmClient(url, options);
};

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

export const getTheGraphClientUrl = (
  network: CurrencyTypes.ChainName,
  options?: TheGraphClientOptions,
) => {
  if (options?.url) return options.url;

  const chain = network.replace('aurora', 'near') as CurrencyTypes.ChainName;
  const theGraphExplorerSubgraphId = THE_GRAPH_EXPLORER_SUBGRAPH_ID[chain];
  const { theGraphExplorerApiKey } = options || {};

  // build URLs
  const theGraphStudioUrl = THE_GRAPH_STUDIO_URL.replace('$NETWORK', chain);
  const theGraphExplorerUrl = THE_GRAPH_EXPLORER_URL.replace(
    '$API_KEY',
    theGraphExplorerApiKey || '',
  ).replace('$SUBGRAPH_ID', theGraphExplorerSubgraphId || '');

  const shouldUseTheGraphExplorer = !!theGraphExplorerApiKey && !!theGraphExplorerSubgraphId;

  switch (true) {
    case chain === 'private':
      return;
    case chain === 'mantle':
      return THE_GRAPH_URL_MANTLE;
    case chain === 'mantle-testnet':
      return THE_GRAPH_URL_MANTLE_TESTNET;
    case chain === 'core':
      return THE_GRAPH_URL_CORE;
    default:
      return shouldUseTheGraphExplorer ? theGraphExplorerUrl : theGraphStudioUrl;
  }
};
