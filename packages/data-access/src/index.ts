import { IDataAccess, IStorage } from '@requestnetwork/types';

export class DataAccess implements IDataAccess {
    private storage: IStorage;
    public constructor(storage: IStorage) {
        this.storage = storage;
    }
    public persist() { return this.storage.add('1'); }
    public get() { return this.storage.read('2'); }
}
