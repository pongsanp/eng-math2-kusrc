import {
  clearDeckInk,
  clearDeckSnippets,
  saveCustomBlankPages,
} from './inkStorage';
import type { SlideLang } from './inkUtils';

export interface SlideNotebook {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocalNotebooksState {
  notebooks: SlideNotebook[];
  deletedIds: string[];
  activeNotebookId: string;
}

export const DEFAULT_NOTEBOOK_ID = 'default';
const NOTEBOOKS_LIST_KEY = 'eng_math_2_notebooks_v1';
const ACTIVE_NOTEBOOK_KEY = 'eng_math_2_active_notebook_v1';
const BASE_DECK_ID = 'ch1';

export function getDefaultNotebookName(isEn = false): string {
  return isEn ? 'Main Notebook' : 'สมุดหลัก';
}

export function createDefaultNotebook(isEn = false): SlideNotebook {
  return {
    id: DEFAULT_NOTEBOOK_ID,
    name: getDefaultNotebookName(isEn),
    createdAt: 0,
    updatedAt: 0,
  };
}

export function normalizeNotebookId(rawId: string): string | null {
  const cleaned = rawId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned || cleaned.length > 24) return null;
  return cleaned;
}

export function generateNotebookId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `s${ts}${rand}`.slice(0, 20);
}

export function getNotebookStorageDeckId(lang: SlideLang, notebookId: string): string {
  const base = lang === 'en' ? `${BASE_DECK_ID}_en` : BASE_DECK_ID;
  if (!notebookId || notebookId === DEFAULT_NOTEBOOK_ID) {
    return base;
  }
  return `nb_${notebookId}__${base}`;
}

export function sanitizeNotebooksList(raw: unknown, isEn = false): SlideNotebook[] {
  const map = new Map<string, SlideNotebook>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const nb = item as Partial<SlideNotebook>;
      if (typeof nb.id !== 'string' || typeof nb.name !== 'string') continue;
      const id = normalizeNotebookId(nb.id);
      const name = nb.name.trim().slice(0, 80);
      if (!id || !name) continue;
      map.set(id, {
        id,
        name,
        createdAt: typeof nb.createdAt === 'number' && Number.isFinite(nb.createdAt) ? Math.max(0, nb.createdAt) : 0,
        updatedAt: typeof nb.updatedAt === 'number' && Number.isFinite(nb.updatedAt) ? Math.max(0, nb.updatedAt) : 0,
      });
    }
  }
  if (!map.has(DEFAULT_NOTEBOOK_ID)) {
    map.set(DEFAULT_NOTEBOOK_ID, createDefaultNotebook(isEn));
  }
  const list = Array.from(map.values());
  list.sort((a, b) => {
    if (a.id === DEFAULT_NOTEBOOK_ID) return -1;
    if (b.id === DEFAULT_NOTEBOOK_ID) return 1;
    return a.createdAt - b.createdAt || a.name.localeCompare(b.name);
  });
  return list.slice(0, 30);
}

export function sanitizeDeletedNotebookIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = normalizeNotebookId(item);
    if (!id || id === DEFAULT_NOTEBOOK_ID || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 100) break;
  }
  return out;
}

export function loadLocalNotebooksState(isEn = false): LocalNotebooksState {
  if (typeof window === 'undefined') {
    return {
      notebooks: [createDefaultNotebook(isEn)],
      deletedIds: [],
      activeNotebookId: DEFAULT_NOTEBOOK_ID,
    };
  }
  let notebooks = [createDefaultNotebook(isEn)];
  let deletedIds: string[] = [];
  let activeNotebookId = DEFAULT_NOTEBOOK_ID;

  try {
    const raw = window.localStorage.getItem(NOTEBOOKS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as
        | { notebooks?: unknown; deletedIds?: unknown }
        | unknown[];
      if (Array.isArray(parsed)) {
        notebooks = sanitizeNotebooksList(parsed, isEn);
      } else if (parsed && typeof parsed === 'object') {
        notebooks = sanitizeNotebooksList(parsed.notebooks, isEn);
        deletedIds = sanitizeDeletedNotebookIds(parsed.deletedIds);
      }
    }
    const savedActive = window.localStorage.getItem(ACTIVE_NOTEBOOK_KEY);
    if (savedActive && notebooks.some((nb) => nb.id === savedActive)) {
      activeNotebookId = savedActive;
    }
  } catch {
    // Ignore malformed localStorage
  }

  return { notebooks, deletedIds, activeNotebookId };
}

export function saveLocalNotebooksState(state: LocalNotebooksState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      NOTEBOOKS_LIST_KEY,
      JSON.stringify({
        notebooks: state.notebooks.slice(0, 30),
        deletedIds: state.deletedIds.slice(0, 100),
      }),
    );
    window.localStorage.setItem(ACTIVE_NOTEBOOK_KEY, state.activeNotebookId);
  } catch {
    // Ignore storage quota errors
  }
}

export function saveActiveNotebookId(notebookId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_NOTEBOOK_KEY, notebookId);
  } catch {
    // Ignore storage errors
  }
}

export async function deleteNotebookLocalData(notebookId: string): Promise<void> {
  if (!notebookId || notebookId === DEFAULT_NOTEBOOK_ID) return;
  const deckIds = [
    getNotebookStorageDeckId('th', notebookId),
    getNotebookStorageDeckId('en', notebookId),
  ];
  await Promise.all(
    deckIds.flatMap((dId) => [
      clearDeckInk(dId),
      clearDeckSnippets(dId),
      saveCustomBlankPages(dId, []),
    ]),
  );
  if (typeof window !== 'undefined') {
    try {
      for (const dId of deckIds) {
        window.localStorage.removeItem(`eng_math_2_${dId}_last_entry_id`);
      }
    } catch {
      // Ignore storage errors
    }
  }
}
