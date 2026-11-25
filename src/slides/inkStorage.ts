import type { CustomBlankPage, InkStroke, SlideSnippet } from './inkUtils';

const DB_NAME = 'eng_math_2_slides_db';
const DB_VERSION = 3;
const STORE_NAME = 'slide_ink';
const CUSTOM_PAGES_STORE = 'custom_pages';
const SNIPPETS_STORE = 'slide_snippets';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openInkDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(CUSTOM_PAGES_STORE)) {
          db.createObjectStore(CUSTOM_PAGES_STORE);
        }
        if (!db.objectStoreNames.contains(SNIPPETS_STORE)) {
          db.createObjectStore(SNIPPETS_STORE);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

function makeKey(deckId: string, slideId: number): string {
  return `${deckId}:${slideId}`;
}

function sanitizeDeckMap(raw: unknown): Record<number, InkStroke[]> {
  const cleaned: Record<number, InkStroke[]> = {};
  if (!raw || typeof raw !== 'object') return cleaned;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const slideId = Number(k);
    if (Number.isFinite(slideId) && Array.isArray(v) && v.length > 0) {
      cleaned[slideId] = v as InkStroke[];
    }
  }
  return cleaned;
}

function readLegacyLocalStorage(legacyKey?: string): Record<number, InkStroke[]> {
  if (!legacyKey || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw) return {};
    return sanitizeDeckMap(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

function writeLegacyLocalStorage(
  legacyKey: string | undefined,
  data: Record<number, InkStroke[]>,
): void {
  if (!legacyKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(legacyKey, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function removeLegacyLocalStorage(legacyKey?: string): void {
  if (!legacyKey || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(legacyKey);
  } catch {
    // ignore storage access errors
  }
}

export async function loadDeckInk(
  deckId: string,
  legacyLocalStorageKey?: string,
): Promise<Record<number, InkStroke[]>> {
  const db = await openInkDb();
  if (!db) {
    return readLegacyLocalStorage(legacyLocalStorageKey);
  }

  const fromDb = await new Promise<Record<number, InkStroke[]>>((resolve) => {
    const result: Record<number, InkStroke[]> = {};
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const range = IDBKeyRange.bound(`${deckId}:`, `${deckId}:\uffff`);
      const req = store.openCursor(range);

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && Array.isArray(cursor.value)) {
            const slideId = Number(cursor.key.slice(deckId.length + 1));
            if (Number.isFinite(slideId) && cursor.value.length > 0) {
              result[slideId] = cursor.value as InkStroke[];
            }
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(result);
      tx.onerror = () => resolve(result);
      tx.onabort = () => resolve(result);
    } catch {
      dbPromise = null;
      resolve(result);
    }
  });

  if (Object.keys(fromDb).length > 0) {
    return fromDb;
  }

  // One-time safe migration from legacy localStorage
  const legacy = readLegacyLocalStorage(legacyLocalStorageKey);
  const legacyEntries = Object.entries(legacy).filter(([, list]) => list.length > 0);
  if (legacyEntries.length === 0) {
    return {};
  }

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [slideIdStr, list] of legacyEntries) {
        const slideId = Number(slideIdStr);
        if (Number.isFinite(slideId)) {
          store.put(list, makeKey(deckId, slideId));
        }
      }
      tx.oncomplete = () => {
        removeLegacyLocalStorage(legacyLocalStorageKey);
        resolve();
      };
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });

  return legacy;
}

export async function saveSlideInk(
  deckId: string,
  slideId: number,
  strokes: InkStroke[],
  legacyLocalStorageKey?: string,
): Promise<void> {
  const db = await openInkDb();
  if (!db) {
    const legacy = readLegacyLocalStorage(legacyLocalStorageKey);
    if (strokes.length === 0) {
      delete legacy[slideId];
    } else {
      legacy[slideId] = strokes;
    }
    writeLegacyLocalStorage(legacyLocalStorageKey, legacy);
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const key = makeKey(deckId, slideId);
      if (strokes.length === 0) {
        store.delete(key);
      } else {
        store.put(strokes, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });
}

export async function clearDeckInk(
  deckId: string,
  legacyLocalStorageKey?: string,
): Promise<void> {
  removeLegacyLocalStorage(legacyLocalStorageKey);
  const db = await openInkDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const range = IDBKeyRange.bound(`${deckId}:`, `${deckId}:\uffff`);
      const req = store.openCursor(range);

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });
}

function sanitizeCustomPages(raw: unknown): CustomBlankPage[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomBlankPage[] = [];
  const seenIds = new Set<number>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Partial<CustomBlankPage>;
    if (
      typeof p.id !== 'number' ||
      !Number.isFinite(p.id) ||
      p.id >= 0 ||
      seenIds.has(p.id) ||
      typeof p.afterSlideId !== 'number' ||
      !Number.isFinite(p.afterSlideId)
    ) {
      continue;
    }
    seenIds.add(p.id);
    out.push({
      id: p.id,
      afterSlideId: p.afterSlideId,
      order: typeof p.order === 'number' && Number.isFinite(p.order) ? p.order : 0,
      lecture: p.lecture === 2 ? 2 : 1,
      paperStyle:
        p.paperStyle === 'lined' || p.paperStyle === 'blank' ? p.paperStyle : 'grid',
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
    });
  }
  return out;
}

function customPagesLsKey(deckId: string): string {
  return `eng_math_2_${deckId}_custom_pages_v1`;
}

export async function loadCustomBlankPages(deckId: string): Promise<CustomBlankPage[]> {
  const lsFallback = (): CustomBlankPage[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(customPagesLsKey(deckId));
      return raw ? sanitizeCustomPages(JSON.parse(raw) as unknown) : [];
    } catch {
      return [];
    }
  };

  const db = await openInkDb();
  if (!db || !db.objectStoreNames.contains(CUSTOM_PAGES_STORE)) {
    return lsFallback();
  }

  return new Promise<CustomBlankPage[]>((resolve) => {
    try {
      const tx = db.transaction(CUSTOM_PAGES_STORE, 'readonly');
      const store = tx.objectStore(CUSTOM_PAGES_STORE);
      const req = store.get(deckId);
      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(sanitizeCustomPages(req.result));
          return;
        }
        resolve(lsFallback());
      };
      req.onerror = () => resolve(lsFallback());
      tx.onabort = () => resolve(lsFallback());
    } catch {
      resolve(lsFallback());
    }
  });
}

export async function saveCustomBlankPages(
  deckId: string,
  pages: CustomBlankPage[],
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(customPagesLsKey(deckId), JSON.stringify(pages));
    } catch {
      // ignore quota errors
    }
  }

  const db = await openInkDb();
  if (!db || !db.objectStoreNames.contains(CUSTOM_PAGES_STORE)) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(CUSTOM_PAGES_STORE, 'readwrite');
      const store = tx.objectStore(CUSTOM_PAGES_STORE);
      store.put(pages, deckId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });
}

function sanitizeSnippetsMap(raw: unknown): Record<number, SlideSnippet[]> {
  const out: Record<number, SlideSnippet[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const slideId = Number(k);
    if (Number.isFinite(slideId) && Array.isArray(v) && v.length > 0) {
      out[slideId] = v.filter(
        (s): s is SlideSnippet =>
          Boolean(s) &&
          typeof s === 'object' &&
          typeof (s as SlideSnippet).id === 'string' &&
          typeof (s as SlideSnippet).x === 'number' &&
          typeof (s as SlideSnippet).y === 'number',
      );
    }
  }
  return out;
}

function snippetsLsKey(deckId: string): string {
  return `eng_math_2_${deckId}_snippets_v1`;
}

function readSnippetsLs(deckId: string): Record<number, SlideSnippet[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(snippetsLsKey(deckId));
    return raw ? sanitizeSnippetsMap(JSON.parse(raw) as unknown) : {};
  } catch {
    return {};
  }
}

function writeSnippetsLs(deckId: string, data: Record<number, SlideSnippet[]>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(snippetsLsKey(deckId), JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export async function loadDeckSnippets(deckId: string): Promise<Record<number, SlideSnippet[]>> {
  const db = await openInkDb();
  if (!db || !db.objectStoreNames.contains(SNIPPETS_STORE)) {
    return readSnippetsLs(deckId);
  }
  return new Promise<Record<number, SlideSnippet[]>>((resolve) => {
    const result: Record<number, SlideSnippet[]> = {};
    try {
      const tx = db.transaction(SNIPPETS_STORE, 'readonly');
      const store = tx.objectStore(SNIPPETS_STORE);
      const range = IDBKeyRange.bound(`${deckId}:`, `${deckId}:\uffff`);
      const req = store.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && Array.isArray(cursor.value)) {
            const slideId = Number(cursor.key.slice(deckId.length + 1));
            if (Number.isFinite(slideId) && cursor.value.length > 0) {
              result[slideId] = cursor.value as SlideSnippet[];
            }
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(Object.keys(result).length > 0 ? result : readSnippetsLs(deckId));
      tx.onerror = () => resolve(readSnippetsLs(deckId));
      tx.onabort = () => resolve(readSnippetsLs(deckId));
    } catch {
      resolve(readSnippetsLs(deckId));
    }
  });
}

export async function saveSlideSnippets(
  deckId: string,
  slideId: number,
  snippets: SlideSnippet[],
): Promise<void> {
  const ls = readSnippetsLs(deckId);
  if (snippets.length === 0) {
    delete ls[slideId];
  } else {
    ls[slideId] = snippets;
  }
  writeSnippetsLs(deckId, ls);

  const db = await openInkDb();
  if (!db || !db.objectStoreNames.contains(SNIPPETS_STORE)) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(SNIPPETS_STORE, 'readwrite');
      const store = tx.objectStore(SNIPPETS_STORE);
      const key = makeKey(deckId, slideId);
      if (snippets.length === 0) {
        store.delete(key);
      } else {
        store.put(snippets, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });
}

export async function clearDeckSnippets(deckId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(snippetsLsKey(deckId));
    } catch {
      // ignore
    }
  }
  const db = await openInkDb();
  if (!db || !db.objectStoreNames.contains(SNIPPETS_STORE)) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(SNIPPETS_STORE, 'readwrite');
      const store = tx.objectStore(SNIPPETS_STORE);
      const range = IDBKeyRange.bound(`${deckId}:`, `${deckId}:\uffff`);
      const req = store.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      dbPromise = null;
      resolve();
    }
  });
}

export interface DeckBackupPayload {
  version: 1;
  app: 'eng-math-2-slides';
  deckId: string;
  exportedAt: string;
  strokesBySlide: Record<number, InkStroke[]>;
  customPages: CustomBlankPage[];
  snippetsBySlide: Record<number, SlideSnippet[]>;
}

export async function exportDeckBackup(
  deckId: string,
  legacyStorageKey?: string,
): Promise<DeckBackupPayload> {
  const [strokesBySlide, customPages, snippetsBySlide] = await Promise.all([
    loadDeckInk(deckId, legacyStorageKey),
    loadCustomBlankPages(deckId),
    loadDeckSnippets(deckId),
  ]);
  return {
    version: 1,
    app: 'eng-math-2-slides',
    deckId,
    exportedAt: new Date().toISOString(),
    strokesBySlide,
    customPages,
    snippetsBySlide,
  };
}

export async function importDeckBackup(
  deckId: string,
  raw: unknown,
  mode: 'replace' | 'merge',
  legacyStorageKey?: string,
): Promise<{
  strokesBySlide: Record<number, InkStroke[]>;
  customPages: CustomBlankPage[];
  snippetsBySlide: Record<number, SlideSnippet[]>;
}> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid backup file');
  }
  const obj = raw as Partial<DeckBackupPayload>;
  if (obj.app !== 'eng-math-2-slides' && !obj.strokesBySlide && !obj.customPages) {
    throw new Error('Unsupported backup format');
  }

  const inStrokes: Record<number, InkStroke[]> = {};
  if (obj.strokesBySlide && typeof obj.strokesBySlide === 'object') {
    for (const [k, list] of Object.entries(obj.strokesBySlide)) {
      const sId = Number(k);
      if (Number.isFinite(sId) && Array.isArray(list)) {
        inStrokes[sId] = list;
      }
    }
  }
  const inPages: CustomBlankPage[] = Array.isArray(obj.customPages) ? obj.customPages : [];
  const inSnips: Record<number, SlideSnippet[]> = {};
  if (obj.snippetsBySlide && typeof obj.snippetsBySlide === 'object') {
    for (const [k, list] of Object.entries(obj.snippetsBySlide)) {
      const sId = Number(k);
      if (Number.isFinite(sId) && Array.isArray(list)) {
        inSnips[sId] = list;
      }
    }
  }

  let finalStrokes: Record<number, InkStroke[]>;
  let finalPages: CustomBlankPage[];
  let finalSnips: Record<number, SlideSnippet[]>;

  if (mode === 'replace') {
    await Promise.all([clearDeckInk(deckId, legacyStorageKey), clearDeckSnippets(deckId)]);
    finalStrokes = inStrokes;
    finalPages = inPages;
    finalSnips = inSnips;
  } else {
    const [curStrokes, curPages, curSnips] = await Promise.all([
      loadDeckInk(deckId, legacyStorageKey),
      loadCustomBlankPages(deckId),
      loadDeckSnippets(deckId),
    ]);
    finalStrokes = { ...curStrokes };
    for (const [k, list] of Object.entries(inStrokes)) {
      const sId = Number(k);
      finalStrokes[sId] = [...(finalStrokes[sId] ?? []), ...list];
    }
    const existingIds = new Set(curPages.map((p) => p.id));
    finalPages = [...curPages, ...inPages.filter((p) => !existingIds.has(p.id))];
    finalSnips = { ...curSnips };
    for (const [k, list] of Object.entries(inSnips)) {
      const sId = Number(k);
      const seenSnips = new Set((finalSnips[sId] ?? []).map((s) => s.id));
      finalSnips[sId] = [...(finalSnips[sId] ?? []), ...list.filter((s) => !seenSnips.has(s.id))];
    }
  }

  await saveCustomBlankPages(deckId, finalPages);
  await Promise.all([
    ...Object.entries(finalStrokes).map(([k, list]) =>
      saveSlideInk(deckId, Number(k), list, legacyStorageKey),
    ),
    ...Object.entries(finalSnips).map(([k, list]) => saveSlideSnippets(deckId, Number(k), list)),
  ]);

  return { strokesBySlide: finalStrokes, customPages: finalPages, snippetsBySlide: finalSnips };
}
