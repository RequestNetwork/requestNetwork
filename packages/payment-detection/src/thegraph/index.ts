import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';

const BASE_URL = `https://api.thegraph.com`;

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Request's subgraph.
 */
export type TheGraphClient = ReturnType<typeof getSdk>;
export const getTheGraphClient = (network: string, baseUrl = BASE_URL): TheGraphClient => {
  if (network === 'private') {
    baseUrl = 'http://localhost:8000';
  }
  // Note: it is also possible to use the IPFS hash of the subgraph
  //  eg. /subgraphs/id/QmcCaSkefrmhe4xQj6Y6BBbHiFkbrn6UGDEBUWER7nt399
  //  which is a better security but would require an update of the
  //  library each time the subgraph is updated, which isn't ideal
  //  for early testing.
  const url = `${baseUrl}/subgraphs/name/requestnetwork/request-payments-${network}`;
  return getSdk(new GraphQLClient(url, {}));
};

// Note: temporary until TheGraph has been thoroughly tested
export const networkSupportsTheGraph = (network: string): boolean => {
  return !['mainnet', 'rinkeby', 'private'].includes(network);
};
