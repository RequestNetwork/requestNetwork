import { CombinedDataAccess } from '@requestnetwork/data-access';

import { SubgraphClient } from './subgraph-client';
import { DataAccessWrite, DataAccessRead } from '@requestnetwork/data-access';
import { TheGraphDataAccessOptions } from './types';
import { NoopDataWrite } from './NoopDataWrite';

export class TheGraphDataAccess extends CombinedDataAccess {
  constructor({ graphql, storage, ...options }: TheGraphDataAccessOptions) {
    const { url, ...rest } = graphql;
    const graphqlClient = new SubgraphClient(url, rest);

    const reader = new DataAccessRead(graphqlClient, options);
    const writer = storage ? new DataAccessWrite(storage) : new NoopDataWrite();

    super(reader, writer);
  }
}
