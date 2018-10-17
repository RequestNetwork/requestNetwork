import { IStorage } from '@requestnetwork/types';

export class EthereumStorage implements IStorage {
    public add() { return '1'; }
    public read() { return '2'; }
}
