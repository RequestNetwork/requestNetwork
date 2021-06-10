import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';

// Note: it is also possible to use the IPFS hash of the subgraph
//  eg. /subgraphs/id/QmcCaSkefrmhe4xQj6Y6BBbHiFkbrn6UGDEBUWER7nt399
//  which is a better security but would require an update of the
//  library each time the subgraph is updated, which isn't ideal
//  for early testing.
const BASE_URL = `https://api.thegraph.com/subgraphs`;

export type TheGraphClient = ReturnType<typeof getSdk>;
export const getTheGraphClient = (network: string, baseUrl = BASE_URL): TheGraphClient => {
  const url = `${baseUrl}/name/requestnetwork/request-payments-${network}`;
  return getSdk(new GraphQLClient(url, {}));
};

// Note: temporary until TheGraph has been thoroughly tested
export const networkSupportsTheGraph = (network: string): boolean => {
  return !['mainnet', 'rinkeby'].includes(network);
};
