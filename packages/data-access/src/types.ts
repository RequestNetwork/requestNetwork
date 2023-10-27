import { DataAccessTypes, LogTypes } from '@requestnetwork/types';

export type DataAccessBaseOptions = {
  network: string;
  logger?: LogTypes.ILogger;
  pendingStore?: DataAccessTypes.IPendingStore;
};
