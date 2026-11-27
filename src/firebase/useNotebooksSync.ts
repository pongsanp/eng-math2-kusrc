import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_NOTEBOOK_ID,
  deleteNotebookLocalData,
  generateNotebookId,
  loadLocalNotebooksState,
  saveActiveNotebookId,
  saveLocalNotebooksState,
  type SlideNotebook,
} from '../slides/notebookStorage';
import { useFirebaseAuth } from './firebaseAuthContext';
import {
  deleteNotebookCloudDecks,
  fetchCloudNotebooks,
  mergeNotebookLists,
  pushCloudNotebooks,
  subscribeCloudNotebooks,
} from './notebookSync';

export function useNotebooksSync(isEn: boolean) {
  const { user } = useFirebaseAuth();
  const uid = user?.uid ?? null;

  const [notebooks, setNotebooks] = useState<SlideNotebook[]>(
    () => loadLocalNotebooksState(isEn).notebooks,
  );
  const [deletedIds, setDeletedIds] = useState<string[]>(
    () => loadLocalNotebooksState(isEn).deletedIds,
  );
  const [activeNotebookId, setActiveNotebookId] = useState<string>(
    () => loadLocalNotebooksState(isEn).activeNotebookId,
  );

  const notebooksRef = useRef(notebooks);
  const deletedIdsRef = useRef(deletedIds);

  useEffect(() => {
    notebooksRef.current = notebooks;
  }, [notebooks]);

  useEffect(() => {
    deletedIdsRef.current = deletedIds;
  }, [deletedIds]);

  const activeNotebook =
    notebooks.find((nb) => nb.id === activeNotebookId) ??
    notebooks[0] ?? {
      id: DEFAULT_NOTEBOOK_ID,
      name: isEn ? 'Main Notebook' : 'สมุดหลัก',
      createdAt: 0,
      updatedAt: 0,
    };

  const commitState = useCallback(
    (nextNotebooks: SlideNotebook[], nextDeleted: string[], nextActiveId: string) => {
      notebooksRef.current = nextNotebooks;
      deletedIdsRef.current = nextDeleted;
      setNotebooks(nextNotebooks);
      setDeletedIds(nextDeleted);
      setActiveNotebookId(nextActiveId);
      saveLocalNotebooksState({
        notebooks: nextNotebooks,
        deletedIds: nextDeleted,
        activeNotebookId: nextActiveId,
      });
      if (uid) {
        void pushCloudNotebooks(uid, nextNotebooks, nextDeleted);
      }
    },
    [uid],
  );

  // Hydrate & live-sync notebook list across devices when signed in
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    let unsub: (() => void) | null = null;

    const init = async () => {
      try {
        const cloud = await fetchCloudNotebooks(uid, isEn);
        if (cancelled) return;
        const local = {
          notebooks: notebooksRef.current,
          deletedIds: deletedIdsRef.current,
        };
        if (!cloud) {
          if (local.notebooks.length > 1 || local.deletedIds.length > 0) {
            await pushCloudNotebooks(uid, local.notebooks, local.deletedIds);
          }
        } else {
          const merged = mergeNotebookLists(local, cloud, isEn);
          notebooksRef.current = merged.notebooks;
          deletedIdsRef.current = merged.deletedIds;
          setNotebooks(merged.notebooks);
          setDeletedIds(merged.deletedIds);
          setActiveNotebookId((prevActive) => {
            const valid = merged.notebooks.some((n) => n.id === prevActive)
              ? prevActive
              : DEFAULT_NOTEBOOK_ID;
            saveLocalNotebooksState({
              notebooks: merged.notebooks,
              deletedIds: merged.deletedIds,
              activeNotebookId: valid,
            });
            return valid;
          });
          // If local had notebooks missing on cloud, push merged list back
          if (
            merged.notebooks.length !== cloud.notebooks.length ||
            merged.deletedIds.length !== cloud.deletedIds.length
          ) {
            await pushCloudNotebooks(uid, merged.notebooks, merged.deletedIds);
          }
        }

        if (cancelled) return;
        unsub = subscribeCloudNotebooks(uid, isEn, (remote) => {
          const merged = mergeNotebookLists(
            { notebooks: notebooksRef.current, deletedIds: deletedIdsRef.current },
            remote,
            isEn,
          );
          notebooksRef.current = merged.notebooks;
          deletedIdsRef.current = merged.deletedIds;
          setNotebooks(merged.notebooks);
          setDeletedIds(merged.deletedIds);
          setActiveNotebookId((prevActive) => {
            const valid = merged.notebooks.some((n) => n.id === prevActive)
              ? prevActive
              : DEFAULT_NOTEBOOK_ID;
            saveLocalNotebooksState({
              notebooks: merged.notebooks,
              deletedIds: merged.deletedIds,
              activeNotebookId: valid,
            });
            return valid;
          });
        });
      } catch {
        // Offline or network transient error: local list remains active
      }
    };

    void init();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [uid, isEn]);

  const selectNotebook = useCallback(
    (notebookId: string) => {
      if (!notebooksRef.current.some((n) => n.id === notebookId)) return;
      setActiveNotebookId(notebookId);
      saveActiveNotebookId(notebookId);
    },
    [],
  );

  const createNotebook = useCallback(
    (rawName: string): SlideNotebook | null => {
      const name = rawName.trim().slice(0, 80);
      if (!name || notebooksRef.current.length >= 30) return null;
      const now = Date.now();
      const newNb: SlideNotebook = {
        id: generateNotebookId(),
        name,
        createdAt: now,
        updatedAt: now,
      };
      const nextNotebooks = [...notebooksRef.current, newNb];
      commitState(nextNotebooks, deletedIdsRef.current, newNb.id);
      return newNb;
    },
    [commitState],
  );

  const renameNotebook = useCallback(
    (notebookId: string, rawName: string) => {
      const name = rawName.trim().slice(0, 80);
      if (!name) return;
      const now = Date.now();
      const nextNotebooks = notebooksRef.current.map((nb) =>
        nb.id === notebookId ? { ...nb, name, updatedAt: now } : nb,
      );
      commitState(nextNotebooks, deletedIdsRef.current, activeNotebookId);
    },
    [commitState, activeNotebookId],
  );

  const deleteNotebook = useCallback(
    async (notebookId: string) => {
      if (!notebookId || notebookId === DEFAULT_NOTEBOOK_ID) return;
      const nextNotebooks = notebooksRef.current.filter((nb) => nb.id !== notebookId);
      const nextDeleted = Array.from(new Set([...deletedIdsRef.current, notebookId])).slice(-100);
      const nextActive = activeNotebookId === notebookId ? DEFAULT_NOTEBOOK_ID : activeNotebookId;
      commitState(nextNotebooks, nextDeleted, nextActive);
      await deleteNotebookLocalData(notebookId);
      if (uid) {
        await deleteNotebookCloudDecks(uid, notebookId).catch(() => {});
      }
    },
    [activeNotebookId, commitState, uid],
  );

  return {
    notebooks,
    activeNotebook,
    activeNotebookId: activeNotebook.id,
    selectNotebook,
    createNotebook,
    renameNotebook,
    deleteNotebook,
  };
}
