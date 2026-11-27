import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_NOTEBOOK_ID,
  getNotebookStorageDeckId,
  sanitizeDeletedNotebookIds,
  sanitizeNotebooksList,
  type SlideNotebook,
} from '../slides/notebookStorage';
import { getFirebaseServices } from './client';
import { getOrCreateDeviceId } from './syncService';

export interface CloudNotebooksMeta {
  notebooks: SlideNotebook[];
  deletedIds: string[];
  updatedAt: number;
}

export async function fetchCloudNotebooks(
  uid: string,
  isEn = false,
): Promise<CloudNotebooksMeta | null> {
  const services = getFirebaseServices();
  if (!services) return null;
  const snap = await getDoc(doc(services.db, 'users', uid, 'meta', 'notebooks'));
  if (!snap.exists()) return null;
  const data = snap.data() as {
    notebooks?: unknown;
    deletedIds?: unknown;
    updatedAt?: unknown;
  };
  return {
    notebooks: sanitizeNotebooksList(data.notebooks, isEn),
    deletedIds: sanitizeDeletedNotebookIds(data.deletedIds),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  };
}

export async function pushCloudNotebooks(
  uid: string,
  notebooks: SlideNotebook[],
  deletedIds: string[],
): Promise<void> {
  const services = getFirebaseServices();
  if (!services) return;
  const cleanNotebooks = sanitizeNotebooksList(notebooks).map((nb) => ({
    id: nb.id,
    name: nb.name,
    createdAt: nb.createdAt,
    updatedAt: nb.updatedAt,
  }));
  const cleanDeleted = sanitizeDeletedNotebookIds(deletedIds);
  await setDoc(doc(services.db, 'users', uid, 'meta', 'notebooks'), {
    notebooks: cleanNotebooks,
    deletedIds: cleanDeleted,
    updatedAt: Date.now(),
    deviceId: getOrCreateDeviceId(),
  });
}

export function mergeNotebookLists(
  local: { notebooks: SlideNotebook[]; deletedIds: string[] },
  cloud: { notebooks: SlideNotebook[]; deletedIds: string[] },
  isEn = false,
): { notebooks: SlideNotebook[]; deletedIds: string[] } {
  const deletedSet = new Set<string>([...local.deletedIds, ...cloud.deletedIds]);
  deletedSet.delete(DEFAULT_NOTEBOOK_ID);

  const byId = new Map<string, SlideNotebook>();
  for (const nb of [...cloud.notebooks, ...local.notebooks]) {
    if (nb.id !== DEFAULT_NOTEBOOK_ID && deletedSet.has(nb.id)) continue;
    const prev = byId.get(nb.id);
    if (!prev || nb.updatedAt > prev.updatedAt) {
      byId.set(nb.id, nb);
    }
  }
  return {
    notebooks: sanitizeNotebooksList(Array.from(byId.values()), isEn),
    deletedIds: Array.from(deletedSet).slice(-100),
  };
}

export function subscribeCloudNotebooks(
  uid: string,
  isEn: boolean,
  onRemoteUpdate: (meta: CloudNotebooksMeta) => void,
): Unsubscribe {
  const services = getFirebaseServices();
  if (!services) return () => {};
  const localDeviceId = getOrCreateDeviceId();
  let initialSkipped = false;

  return onSnapshot(doc(services.db, 'users', uid, 'meta', 'notebooks'), (snap) => {
    if (!initialSkipped) {
      initialSkipped = true;
      return;
    }
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    const data = snap.data() as {
      notebooks?: unknown;
      deletedIds?: unknown;
      updatedAt?: unknown;
      deviceId?: unknown;
    };
    if (data.deviceId === localDeviceId) return;
    onRemoteUpdate({
      notebooks: sanitizeNotebooksList(data.notebooks, isEn),
      deletedIds: sanitizeDeletedNotebookIds(data.deletedIds),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    });
  });
}

export async function deleteNotebookCloudDecks(uid: string, notebookId: string): Promise<void> {
  if (!notebookId || notebookId === DEFAULT_NOTEBOOK_ID) return;
  const services = getFirebaseServices();
  if (!services) return;
  const { db } = services;
  const deckIds = [
    getNotebookStorageDeckId('th', notebookId),
    getNotebookStorageDeckId('en', notebookId),
  ];
  for (const deckId of deckIds) {
    const slidesSnap = await getDocs(collection(db, 'users', uid, 'decks', deckId, 'slides'));
    if (!slidesSnap.empty) {
      const batch = writeBatch(db);
      for (const sDoc of slidesSnap.docs) {
        batch.delete(sDoc.ref);
      }
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', uid, 'decks', deckId));
  }
}
