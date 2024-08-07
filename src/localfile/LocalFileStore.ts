import { openDB, IDBPDatabase, DBSchema } from 'idb';

interface DB extends DBSchema {
  localfile: {
    key: string;
    value: FileSystemFileHandle;
  };
}

export class LocalFileStore {
  db: Promise<IDBPDatabase<DB>>;
  storeName: 'localfile';

  constructor() {
    this.db = openDB<DB>('localfile', 1, {
      upgrade(db) {
        db.createObjectStore('localfile');
      },
    });
    this.storeName = 'localfile';
  }

  async get(key: string) {
    return (await this.db).get(this.storeName, key);
  }

  async set(key: string | undefined, val: FileSystemFileHandle) {
    return (await this.db).put(this.storeName, val, key);
  }

  // TODO: we should call this when images are deleted
  async delete(key: string) {
    return (await this.db).delete(this.storeName, key);
  }
}
