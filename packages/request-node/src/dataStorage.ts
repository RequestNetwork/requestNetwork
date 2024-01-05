import * as config from './config';

import { IpfsStorage } from '@requestnetwork/ethereum-storage';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

export function getDataStorage(logger: LogTypes.ILogger): StorageTypes.IIpfsStorage {
  return new IpfsStorage({
    logger,
    ipfsUrl: config.getIpfsUrl(),
    ipfsTimeout: config.getIpfsTimeout(),
  });
}
