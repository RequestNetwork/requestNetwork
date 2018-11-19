import { IDataAccess, IStorage } from '@requestnetwork/types';

export class DataAccess implements IDataAccess {
  private storage: IStorage;
  public constructor(storage: IStorage) {
    this.storage = storage;
  }
  public persist(transaction: string, indexed?: string[]): string {
    return this.storage.add('1');
  }
  public get(index: string): any[] {
    // return this.storage.read('2');
    return [];
  }
}
