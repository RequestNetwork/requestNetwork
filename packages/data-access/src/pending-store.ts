import { DataAccessTypes } from '@requestnetwork/types';

/**
 * A simple in-memory store to share state between DataReader and DataWriter
 * Useful to retrieve a transaction that was just emitted but is not confirmed yet
 **/
export class PendingStore implements DataAccessTypes.IPendingStore {
  private pending = new Map<string, DataAccessTypes.PendingItem>();

  /** Gets a pending tx */
  public get(channelId: string): DataAccessTypes.PendingItem | undefined {
    return this.pending.get(channelId);
  }

  public findByTopics(topics: string[]): (DataAccessTypes.PendingItem & { channelId: string })[] {
    const results: (DataAccessTypes.PendingItem & { channelId: string })[] = [];
    for (const [channelId, pendingItem] of this.pending.entries()) {
      if (topics.find((topic) => pendingItem.topics.includes(topic))) {
        results.push({ channelId, ...pendingItem });
      }
    }
    return results;
  }

  public add(channelId: string, pendingItem: DataAccessTypes.PendingItem): void {
    this.pending.set(channelId, pendingItem);
  }

  public remove(channelId: string): void {
    this.pending.delete(channelId);
  }
}
