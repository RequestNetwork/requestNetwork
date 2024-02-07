import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql-superfluid';
import { RequestConfig } from 'graphql-request/src/types';
import { ChainTypes } from '@requestnetwork/types';

const BASE_URL = `https://api.thegraph.com`;
const NETWORK_TO_URL: Record<string, string> = {
  optimism: 'optimism-mainnet',
  avalanche: 'avalanche-c',
};

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Superfluid's subgraph.
 */
export type TheGraphSuperfluidClient = ReturnType<typeof getSdk>;
export type TheGraphClientOptions = RequestConfig & {
  baseUrl?: string;
};

export const getTheGraphSuperfluidClient = (
  chain: ChainTypes.IEvmChain,
  options?: TheGraphClientOptions,
): TheGraphSuperfluidClient => {
  const { baseUrl: _baseUrl, ...clientOptions } = options ?? {};

  const baseUrl = _baseUrl || chain.name === 'private' ? 'http://localhost:8000' : BASE_URL;
  // Note: it is also possible to use the IPFS hash of the subgraph
  //  eg. /subgraphs/id/QmcCaSkefrmhe4xQj6Y6BBbHiFkbrn6UGDEBUWER7nt399
  //  which is a better security but would require an update of the
  //  library each time the subgraph is updated, which isn't ideal
  //  for early testing.
  const url = `${baseUrl}/subgraphs/name/superfluid-finance/protocol-v1-${
    NETWORK_TO_URL[chain.name] || chain.name
  }`;
  return getSdk(new GraphQLClient(url, clientOptions));
};
