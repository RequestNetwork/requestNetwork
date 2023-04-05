/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CurrencyTypes } from '@requestnetwork/types';
import { NearChains } from '@requestnetwork/currency';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';

const HOSTED_THE_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-';

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Request's subgraph.
 *
 * @type TGraphClientVariant: null if no variant, 'near' if native token payments detection on Near
 */
export type TheGraphClient<TChain extends CurrencyTypes.VMChainName = CurrencyTypes.EvmChainName> =
  TChain extends CurrencyTypes.NearChainName
    ? ReturnType<typeof getTheGraphNearClient>
    : ReturnType<typeof getTheGraphClient>;

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
    : getTheGraphClient(`${HOSTED_THE_GRAPH_URL}${network}`);
};
