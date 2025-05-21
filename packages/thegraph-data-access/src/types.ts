import type { StorageTypes } from '@requestnetwork/types';
import type { DataAccessBaseOptions } from '@requestnetwork/data-access';
import type { GraphQLClient } from 'graphql-request';

type RequestConfig = (typeof GraphQLClient.prototype)['requestConfig'];
export type TheGraphDataAccessOptions = DataAccessBaseOptions & {
  graphql: { url: string } & Omit<RequestConfig, 'headers'> & { headers?: Record<string, string> };
  storage?: StorageTypes.IStorageWrite;
};
