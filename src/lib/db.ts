import type { JobRecord } from "./job-types";

const DB_NAME = "pixelpress";
const DB_VERSION = 1;
const STORE = "jobs";
const JOB_TTL_MS = 6 * 60 * 60 * 1000;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser context."));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("Failed to open local database"));
    });
  }
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result: T | undefined;
    let hasResult = false;
    const req = fn(store);
    if (req) {
      req.onsuccess = () => {
        result = req.result;
        hasResult = true;
      };
      req.onerror = () => reject(req.error ?? new Error("Local database request failed"));
    }
    tx.oncomplete = () => {
      if (!hasResult) resolve(undefined as T);
      else resolve(result as T);
    };
    tx.onabort = tx.onerror = () => reject(tx.error ?? new Error("Local database transaction failed"));
  });
}

export async function putJob(job: JobRecord): Promise<void> {
  await withStore("readwrite", (store) => store.put(job));
}

export async function getJob(id: string): Promise<JobRecord | undefined> {
  return withStore<JobRecord | undefined>("readonly", (store) => store.get(id));
}

export async function deleteJob(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function allJobIds(): Promise<string[]> {
  return withStore<string[]>("readonly", (store) => store.getAllKeys() as IDBRequest<string[]>);
}

export async function cleanupOldJobs(): Promise<void> {
  try {
    const ids = await allJobIds();
    const now = Date.now();
    for (const id of ids) {
      const job = await getJob(id);
      if (job && now - job.updatedAt > JOB_TTL_MS) {
        await deleteJob(id);
      }
    }
  } catch {
    // best effort cleanup; local storage issues should never break the app
  }
}

export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}
