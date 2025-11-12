const DB_NAME = 'RuggedCustomsDB';
const DB_VERSION = 1;
const STORES = ['sites', 'paymentRequests', 'teamMembers', 'transporters', 'jobCards'];

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
          // All objects stored have a unique 'id' property.
          dbInstance.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
};

export const saveData = <T extends { id: any }>(storeName: string, data: T[]): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("DB not initialized");
            return reject(false);
        }
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear the store first
        const clearRequest = store.clear();
        
        clearRequest.onerror = () => {
             console.error(`Error clearing store ${storeName}:`, clearRequest.error);
             transaction.abort();
             reject(false);
        }

        clearRequest.onsuccess = () => {
            // Then add all new data. If an item fails, transaction will abort.
            data.forEach(item => {
                store.put(item);
            });
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

    transaction.onerror = () => {
      console.error(`Error saving data to ${storeName}:`, transaction.error);
      reject(false);
    };
    });
};

export const loadData = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("DB not initialized");
            return reject(false);
        }
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`Error loading data from ${storeName}:`, request.error);
            reject([]);
        };
    });
};