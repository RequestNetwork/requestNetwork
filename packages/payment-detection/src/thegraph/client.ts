/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';
import { getSdk as getNearSdk } from './generated/graphql-near';

// NB: the GraphQL client is automatically generated based on files present in ./queries,
// using graphql-codegen.
// To generate types, run `yarn codegen`, then open the generated files so that the code editor picks up the changes.
/**
 * A GraphQL client to query Request's subgraph.
 *
 * @type TGraphClientVariant: null if no variant, 'near' if native token payments detection on Near
 */
export type TheGraphClient<TGraphClientVariant extends 'near' | null = null> =
  TGraphClientVariant extends 'near'
    ? ReturnType<typeof getTheGraphNearClient>
    : ReturnType<typeof getTheGraphClient>;

export type TheGraphClientOptions = {
  timeout?: number;
};

export const getTheGraphClient = (url: string, options?: TheGraphClientOptions) =>
  getSdk(new GraphQLClient(url, options));

export const getTheGraphNearClient = (url: string, options?: TheGraphClientOptions) =>
  getNearSdk(new GraphQLClient(url, options));
