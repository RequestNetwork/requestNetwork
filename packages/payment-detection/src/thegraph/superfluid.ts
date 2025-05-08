import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql-superfluid';

const BASE_URL = `https://subgraph-endpoints.superfluid.dev`;
const NETWORK_TO_URL: Record<string, string> = {
  'arbitrum-one': 'arbitrum-one',
  avalanche: 'avalanche-c',
  base: 'base-mainnet',
  bsc: 'bsc-mainnet',
  celo: 'celo-mainnet',
  mainnet: 'eth-mainnet',
  matic: 'polygon-mainnet',
  optimism: 'optimism-mainnet',
  sepolia: 'eth-sepolia',
  xdai: 'xdai-mainnet',
};

type RequestConfig = (typeof GraphQLClient.prototype)['requestConfig'];

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
  network: string,
  options?: TheGraphClientOptions,
): TheGraphSuperfluidClient => {
  const { baseUrl: _baseUrl, ...clientOptions } = options ?? {};
  const url = buildTheGraphSuperfluidUrl(_baseUrl, network);
  return getSdk(new GraphQLClient(url, clientOptions));
};

export const buildTheGraphSuperfluidUrl = (
  baseUrl: string | undefined,
  network: string,
): string => {
  // Note: it is also possible to use the IPFS hash of the subgraph
  //  eg. /subgraphs/id/QmcCaSkefrmhe4xQj6Y6BBbHiFkbrn6UGDEBUWER7nt399
  //  which is a better security but would require an update of the
  //  library each time the subgraph is updated, which isn't ideal
  //  for early testing.
  return network === 'private'
    ? 'http://localhost:8000/subgraphs/name/superfluid-finance/protocol-v1-goerli'
    : `${baseUrl || BASE_URL}/${NETWORK_TO_URL[network]}/protocol-v1`;
};
