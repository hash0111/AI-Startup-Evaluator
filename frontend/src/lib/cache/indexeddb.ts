const DB_NAME = "ai-evaluator-cache";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function indexedDBGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readonly");
      const store = tx.objectStore("cache");
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result?.data ?? null);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function indexedDBSet<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readwrite");
      const store = tx.objectStore("cache");
      store.put({ key, data, timestamp: Date.now() });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail — cache miss is handled gracefully
  }
}

export async function indexedDBDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readwrite");
      const store = tx.objectStore("cache");
      store.delete(key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail
  }
}

export async function indexedDBClear(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readwrite");
      const store = tx.objectStore("cache");
      store.clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail
  }
}
