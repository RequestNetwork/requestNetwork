/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';

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
    options?: {
      /** constraint to select indexers that have at least parsed this block */
      minIndexedBlock?: number;
    };
  };

export type TheGraphClientOptions = {
  timeout?: number;
};

export const getTheGraphClient = (url: string, options?: TheGraphClientOptions) =>
  getSdk(new GraphQLClient(url, options));

export const getTheGraphNearClient = (url: string, options?: TheGraphClientOptions) =>
  getNearSdk(new GraphQLClient(url, options));

export const defaultGetTheGraphClient = (network: CurrencyTypes.ChainName) => {
  return network === 'private'
    ? undefined
    : NearChains.isChainSupported(network)
    ? getTheGraphNearClient(`${HOSTED_THE_GRAPH_URL}${network.replace('aurora', 'near')}`)
    : network === 'mantle'
    ? getTheGraphClient(THE_GRAPH_URL_MANTLE)
    : network === 'mantle-testnet'
    ? getTheGraphClient(THE_GRAPH_URL_MANTLE_TESTNET)
    : getTheGraphClient(`${HOSTED_THE_GRAPH_URL}${network}`);
};
