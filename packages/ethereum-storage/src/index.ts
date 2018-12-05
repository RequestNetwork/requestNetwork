import { IStorage } from '@requestnetwork/types';

/**
 * Implementation of Storage on Ethereum and IPFS
 */
export class EthereumStorage implements IStorage {
  public async append(): Promise<string> {
    return '1';
  }
  public async read(): Promise<string> {
    return '2';
  }
  public async getAllDataId(): Promise<string[]> {
    return [];
  }
}
