import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { getSdk as getSdkNear } from './generated/graphql-near';

const BASE_URL = `https://api.thegraph.com`;

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Request's subgraph.
 */
export type TheGraphClient<
  TGraphClientVariant extends 'near' | null = null
> = TGraphClientVariant extends 'near' ? ReturnType<typeof getSdkNear> : ReturnType<typeof getSdk>;
export type TheGraphClientOptions = {
  baseUrl?: string;
  timeout?: number;
};

export const getTheGraphClient = <TGraphClientVariant extends 'near' | null = null>(
  network: string,
  options?: TheGraphClientOptions,
) => {
  const baseUrl = options?.baseUrl || network === 'private' ? 'http://localhost:8000' : BASE_URL;
  // Note: it is also possible to use the IPFS hash of the subgraph
  //  eg. /subgraphs/id/QmcCaSkefrmhe4xQj6Y6BBbHiFkbrn6UGDEBUWER7nt399
  //  which is a better security but would require an update of the
  //  library each time the subgraph is updated, which isn't ideal
  //  for early testing.
  const url = `${baseUrl}/subgraphs/name/requestnetwork/request-payments-${network}`;
  if (network === 'near') {
    return getSdkNear(new GraphQLClient(url, options)) as TheGraphClient<TGraphClientVariant>;
  }
  return getSdk(new GraphQLClient(url, options)) as TheGraphClient<TGraphClientVariant>;
};

export const networkSupportsTheGraph = (network: string): boolean => {
  return network !== 'private';
};
