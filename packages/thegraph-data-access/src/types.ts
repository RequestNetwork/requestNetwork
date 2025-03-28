import { StorageTypes } from '@requestnetwork/types';
import { DataAccessBaseOptions } from '@requestnetwork/data-access';
import { RequestConfig } from 'graphql-request/build/legacy/helpers/types';

export type TheGraphDataAccessOptions = DataAccessBaseOptions & {
  graphql: { url: string } & Omit<RequestConfig, 'headers'> & { headers?: Record<string, string> };
  storage?: StorageTypes.IStorageWrite;
};
