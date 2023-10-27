import { StorageTypes } from '@requestnetwork/types';
import { DataAccessBaseOptions } from '@requestnetwork/data-access';

import { RequestInit } from 'graphql-request/dist/types.dom';

export type TheGraphDataAccessOptions = DataAccessBaseOptions & {
  graphql: { url: string } & RequestInit;
  storage?: StorageTypes.IStorageWrite;
};
