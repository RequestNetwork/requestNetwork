/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { TheGraphClient } from '../client';
export const theGraphClient: TheGraphClient = {
  GetLastSyncedBlock: jest.fn(),
  GetPaymentsAndEscrowState: jest.fn(),
  GetPaymentsAndEscrowStateForReceivables: jest.fn(),
  GetSyncedBlock: jest.fn(),
};
export const getTheGraphClient = () => theGraphClient;

export const getTheGraphNearClient = () => {
  throw new Error('not implemented');
};
