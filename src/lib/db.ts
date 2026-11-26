import type { JobRecord } from "./job-types";

const DB_NAME = "pixelpress";
const DB_VERSION = 1;
const STORE = "jobs";
const JOB_TTL_MS = 6 * 60 * 60 * 1000;
const OPEN_TIMEOUT_MS = 2000;

type Mode = "pending" | "idb" | "memory";

let mode: Mode = "pending";
let dbPromise: Promise<IDBDatabase | null> | null = null;

const memJobs = new Map<string, JobRecord>();

function openDbOnce(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let settled = false;
    const settle = (db: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      mode = db ? "idb" : "memory";
      resolve(db);
    };
    try {
      if (typeof indexedDB === "undefined") {
        settle(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => settle(req.result);
      req.onerror = () => settle(null);
      req.onblocked = () => settle(null);
      setTimeout(() => settle(null), OPEN_TIMEOUT_MS);
    } catch {
      settle(null);
    }
  });
  return dbPromise;
}

async function storageMode(): Promise<Mode> {
  if (mode === "pending") await openDbOnce();
  return mode;
}

function degradeToMemory(): void {
  mode = "memory";
  dbPromise = Promise.resolve(null);
}

function runTx<T>(
  db: IDBDatabase,
  txnMode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, txnMode);
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
  if ((await storageMode()) === "memory") {
    memJobs.set(job.id, job);
    return;
  }
  try {
    const db = await openDbOnce();
    if (!db) throw new Error("unavailable");
    await runTx(db, "readwrite", (store) => store.put(job));
  } catch {
    degradeToMemory();
    memJobs.set(job.id, job);
  }
}

export async function getJob(id: string): Promise<JobRecord | undefined> {
  if ((await storageMode()) === "memory") {
    return memJobs.get(id);
  }
  try {
    const db = await openDbOnce();
    if (!db) throw new Error("unavailable");
    return await runTx<JobRecord | undefined>(db, "readonly", (store) => store.get(id));
  } catch {
    degradeToMemory();
    return memJobs.get(id);
  }
}

export async function deleteJob(id: string): Promise<void> {
  if ((await storageMode()) === "memory") {
    memJobs.delete(id);
    return;
  }
  try {
    const db = await openDbOnce();
    if (!db) throw new Error("unavailable");
    await runTx(db, "readwrite", (store) => store.delete(id));
  } catch {
    degradeToMemory();
    memJobs.delete(id);
  }
}

export async function allJobIds(): Promise<string[]> {
  if ((await storageMode()) === "memory") {
    return [...memJobs.keys()];
  }
  try {
    const db = await openDbOnce();
    if (!db) throw new Error("unavailable");
    return await runTx<string[]>(db, "readonly", (store) => store.getAllKeys() as IDBRequest<string[]>);
  } catch {
    degradeToMemory();
    return [...memJobs.keys()];
  }
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
  return mode !== "memory";
}
