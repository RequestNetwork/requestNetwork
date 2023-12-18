import { StorageTypes } from '@requestnetwork/types';
import { DataAccessBaseOptions } from '@requestnetwork/data-access';

import { RequestConfig } from 'graphql-request/build/cjs/types';

export type TheGraphDataAccessOptions = DataAccessBaseOptions & {
  graphql: { url: string } & RequestConfig;
  storage?: StorageTypes.IStorageWrite;
};
