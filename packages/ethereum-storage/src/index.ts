import { IStorage } from '@requestnetwork/types';

export class EthereumStorage implements IStorage {
  public async append() {
    return '1';
  }
  public async read() {
    return '2';
  }
  public async getAllDataId() {
    return [];
  }
}
