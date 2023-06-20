import { IpfsStorage } from '@requestnetwork/ethereum-storage';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config';

export function getIpfsStorage(logger?: LogTypes.ILogger): StorageTypes.IIpfsStorage {
  return new IpfsStorage({ ipfsGatewayConnection: config.getIpfsConfiguration(), logger });
}
