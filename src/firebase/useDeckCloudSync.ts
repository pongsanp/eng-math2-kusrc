import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  clearDeckInk,
  clearDeckSnippets,
  saveCustomBlankPages,
  saveSlideInk,
  saveSlideSnippets,
} from '../slides/inkStorage';
import type { CustomBlankPage, InkStroke, SlideSnippet } from '../slides/inkUtils';
import type { CloudSyncState } from '../components/CloudSyncButton';
import type { CloudSyncConflictInfo } from '../components/CloudSyncConflictModal';
import { useFirebaseAuth } from './firebaseAuthContext';
import {
  fetchCloudDeck,
  isDeckCloudBound,
  markDeckCloudBound,
  mergeDeckSnapshots,
  pushDeckDeltaToCloud,
  pushEntireDeckToCloud,
  subscribeCloudDeck,
  summarizeDeckData,
  type CloudDeckFetchResult,
  type DeckDataSnapshot,
} from './syncService';

interface PendingConflictState {
  info: CloudSyncConflictInfo;
  cloud: CloudDeckFetchResult;
}

interface UseDeckCloudSyncOptions {
  deckId: string;
  legacyInkKey?: string;
  localHydrated: boolean;
  isEn: boolean;
  strokesRef: MutableRefObject<Record<number, InkStroke[]>>;
  snippetsRef: MutableRefObject<Record<number, SlideSnippet[]>>;
  customPagesRef: MutableRefObject<CustomBlankPage[]>;
  onApplySnapshot: (snapshot: DeckDataSnapshot) => void;
  onApplyRemoteMeta: (pages: CustomBlankPage[]) => void;
  onApplyRemoteSlide: (
    slideId: number,
    strokes: InkStroke[],
    snippets: SlideSnippet[],
  ) => void;
  onApplyRemoteSlideRemove: (slideId: number) => void;
}

function dirtyStorageKey(uid: string, deckId: string): string {
  return `eng_math_2_dirty_slides_${uid}_${deckId}`;
}

function readPersistedDirty(
  uid: string,
  deckId: string,
): { slides: number[]; deleted: number[]; meta: boolean } {
  if (typeof window === 'undefined') return { slides: [], deleted: [], meta: false };
  try {
    const raw = window.localStorage.getItem(dirtyStorageKey(uid, deckId));
    if (!raw) return { slides: [], deleted: [], meta: false };
    const parsed = JSON.parse(raw) as {
      slides?: unknown;
      deleted?: unknown;
      meta?: unknown;
    };
    return {
      slides: Array.isArray(parsed.slides)
        ? parsed.slides.map(Number).filter((n) => Number.isFinite(n))
        : [],
      deleted: Array.isArray(parsed.deleted)
        ? parsed.deleted.map(Number).filter((n) => Number.isFinite(n))
        : [],
      meta: Boolean(parsed.meta),
    };
  } catch {
    return { slides: [], deleted: [], meta: false };
  }
}

function writePersistedDirty(
  uid: string,
  deckId: string,
  slides: Set<number>,
  deleted: Set<number>,
  meta: boolean,
): void {
  if (typeof window === 'undefined') return;
  try {
    if (slides.size === 0 && deleted.size === 0 && !meta) {
      window.localStorage.removeItem(dirtyStorageKey(uid, deckId));
    } else {
      window.localStorage.setItem(
        dirtyStorageKey(uid, deckId),
        JSON.stringify({
          slides: Array.from(slides),
          deleted: Array.from(deleted),
          meta,
        }),
      );
    }
  } catch {
    // Ignore storage errors
  }
}

async function persistSnapshotToLocalDb(
  deckId: string,
  snapshot: DeckDataSnapshot,
  legacyInkKey?: string,
): Promise<void> {
  await Promise.all([clearDeckInk(deckId, legacyInkKey), clearDeckSnippets(deckId)]);
  await saveCustomBlankPages(deckId, snapshot.customPages);
  await Promise.all([
    ...Object.entries(snapshot.strokesBySlide).map(([k, list]) =>
      saveSlideInk(deckId, Number(k), list, legacyInkKey),
    ),
    ...Object.entries(snapshot.snippetsBySlide).map(([k, list]) =>
      saveSlideSnippets(deckId, Number(k), list),
    ),
  ]);
}

export function useDeckCloudSync({
  deckId,
  legacyInkKey,
  localHydrated,
  isEn,
  strokesRef,
  snippetsRef,
  customPagesRef,
  onApplySnapshot,
  onApplyRemoteMeta,
  onApplyRemoteSlide,
  onApplyRemoteSlideRemove,
}: UseDeckCloudSyncOptions) {
  const { user, signOut } = useFirebaseAuth();
  const uid = user?.uid ?? null;

  const [syncState, setSyncState] = useState<CloudSyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflictState | null>(null);
  const [resolvingConflict, setResolvingConflict] = useState(false);

  const cloudReadyRef = useRef(false);
  const dirtySlidesRef = useRef<Set<number>>(new Set());
  const deletedSlidesRef = useRef<Set<number>>(new Set());
  const dirtyMetaRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const flushingRef = useRef(false);

  const callbacksRef = useRef({
    onApplySnapshot,
    onApplyRemoteMeta,
    onApplyRemoteSlide,
    onApplyRemoteSlideRemove,
  });
  useEffect(() => {
    callbacksRef.current = {
      onApplySnapshot,
      onApplyRemoteMeta,
      onApplyRemoteSlide,
      onApplyRemoteSlideRemove,
    };
  }, [onApplySnapshot, onApplyRemoteMeta, onApplyRemoteSlide, onApplyRemoteSlideRemove]);

  const flushPendingSync = useCallback(async () => {
    if (!uid || !cloudReadyRef.current || flushingRef.current) return;
    const dirtySlideIds = Array.from(dirtySlidesRef.current);
    const deletedSlideIds = Array.from(deletedSlidesRef.current);
    const dirtyMeta = dirtyMetaRef.current;

    if (!dirtyMeta && dirtySlideIds.length === 0 && deletedSlideIds.length === 0) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSyncState('offline');
      return;
    }

    flushingRef.current = true;
    setSyncState('syncing');
    setSyncError(null);

    dirtySlidesRef.current.clear();
    deletedSlidesRef.current.clear();
    dirtyMetaRef.current = false;

    try {
      await pushDeckDeltaToCloud(uid, deckId, {
        dirtySlideIds,
        deletedSlideIds,
        dirtyMeta,
        strokesBySlide: strokesRef.current,
        snippetsBySlide: snippetsRef.current,
        customPages: customPagesRef.current,
      });
      writePersistedDirty(
        uid,
        deckId,
        dirtySlidesRef.current,
        deletedSlidesRef.current,
        dirtyMetaRef.current,
      );
      setLastSyncedAt(Date.now());
      setSyncState('synced');
    } catch (err) {
      for (const id of dirtySlideIds) dirtySlidesRef.current.add(id);
      for (const id of deletedSlideIds) deletedSlidesRef.current.add(id);
      if (dirtyMeta) dirtyMetaRef.current = true;
      writePersistedDirty(
        uid,
        deckId,
        dirtySlidesRef.current,
        deletedSlidesRef.current,
        dirtyMetaRef.current,
      );
      setSyncState('error');
      setSyncError(
        err instanceof Error
          ? err.message
          : isEn
            ? 'Failed to sync notes to Cloud'
            : 'ไม่สามารถซิงก์โน้ตขึ้น Cloud ได้',
      );
    } finally {
      flushingRef.current = false;
    }
  }, [uid, deckId, strokesRef, snippetsRef, customPagesRef, isEn]);

  const scheduleDebouncedFlush = useCallback(() => {
    if (!uid || !cloudReadyRef.current) return;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void flushPendingSync();
    }, 2000);
  }, [uid, flushPendingSync]);

  const notifySlideDirty = useCallback(
    (slideId: number) => {
      if (!uid) return;
      deletedSlidesRef.current.delete(slideId);
      dirtySlidesRef.current.add(slideId);
      writePersistedDirty(
        uid,
        deckId,
        dirtySlidesRef.current,
        deletedSlidesRef.current,
        dirtyMetaRef.current,
      );
      if (cloudReadyRef.current) {
        setSyncState('syncing');
        scheduleDebouncedFlush();
      }
    },
    [uid, deckId, scheduleDebouncedFlush],
  );

  const notifySlideDeleted = useCallback(
    (slideId: number) => {
      if (!uid) return;
      dirtySlidesRef.current.delete(slideId);
      deletedSlidesRef.current.add(slideId);
      dirtyMetaRef.current = true;
      writePersistedDirty(
        uid,
        deckId,
        dirtySlidesRef.current,
        deletedSlidesRef.current,
        dirtyMetaRef.current,
      );
      if (cloudReadyRef.current) {
        setSyncState('syncing');
        scheduleDebouncedFlush();
      }
    },
    [uid, deckId, scheduleDebouncedFlush],
  );

  const notifyMetaDirty = useCallback(() => {
    if (!uid) return;
    dirtyMetaRef.current = true;
    writePersistedDirty(
      uid,
      deckId,
      dirtySlidesRef.current,
      deletedSlidesRef.current,
      dirtyMetaRef.current,
    );
    if (cloudReadyRef.current) {
      setSyncState('syncing');
      scheduleDebouncedFlush();
    }
  }, [uid, deckId, scheduleDebouncedFlush]);

  // Initial Cloud hydration / migration + live subscription when signed in & local DB ready
  useEffect(() => {
    cloudReadyRef.current = false;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!uid || !localHydrated) {
      return;
    }

    let cancelled = false;
    let unsubCloud: (() => void) | null = null;

    const startRealtimeSubscription = () => {
      if (cancelled) return;
      unsubCloud = subscribeCloudDeck(uid, deckId, {
        onRemoteMeta: (pages) => {
          if (dirtyMetaRef.current) return;
          customPagesRef.current = pages;
          void saveCustomBlankPages(deckId, pages);
          callbacksRef.current.onApplyRemoteMeta(pages);
          setLastSyncedAt(Date.now());
          setSyncState('synced');
        },
        onRemoteSlideChange: (slideId, strokes, snippets) => {
          if (dirtySlidesRef.current.has(slideId)) return;
          void saveSlideInk(deckId, slideId, strokes, legacyInkKey);
          void saveSlideSnippets(deckId, slideId, snippets);
          callbacksRef.current.onApplyRemoteSlide(slideId, strokes, snippets);
          setLastSyncedAt(Date.now());
          setSyncState('synced');
        },
        onRemoteSlideRemove: (slideId) => {
          if (dirtySlidesRef.current.has(slideId)) return;
          void saveSlideInk(deckId, slideId, [], legacyInkKey);
          void saveSlideSnippets(deckId, slideId, []);
          callbacksRef.current.onApplyRemoteSlideRemove(slideId);
          setLastSyncedAt(Date.now());
          setSyncState('synced');
        },
        onError: () => {
          setSyncState(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error',
          );
        },
      });
    };

    const runInitialSync = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setSyncState('offline');
        cloudReadyRef.current = true;
        startRealtimeSubscription();
        return;
      }

      setSyncState('syncing');
      setSyncError(null);
      setPendingConflict(null);

      try {
        const persistedDirty = readPersistedDirty(uid, deckId);
        for (const id of persistedDirty.slides) dirtySlidesRef.current.add(id);
        for (const id of persistedDirty.deleted) deletedSlidesRef.current.add(id);
        if (persistedDirty.meta) dirtyMetaRef.current = true;

        const cloudRes = await fetchCloudDeck(uid, deckId);
        if (cancelled) return;

        const localSnapshot: DeckDataSnapshot = {
          strokesBySlide: strokesRef.current,
          customPages: customPagesRef.current,
          snippetsBySlide: snippetsRef.current,
        };
        const localSummary = summarizeDeckData(localSnapshot);
        const cloudSummary = summarizeDeckData(cloudRes);
        const alreadyBound = isDeckCloudBound(uid, deckId);

        if (!cloudRes.hasCloudData) {
          if (localSummary.hasData) {
            await pushEntireDeckToCloud(uid, deckId, localSnapshot, false);
          }
          if (cancelled) return;
          markDeckCloudBound(uid, deckId);
          dirtySlidesRef.current.clear();
          deletedSlidesRef.current.clear();
          dirtyMetaRef.current = false;
          writePersistedDirty(
            uid,
            deckId,
            dirtySlidesRef.current,
            deletedSlidesRef.current,
            dirtyMetaRef.current,
          );
          cloudReadyRef.current = true;
          setLastSyncedAt(Date.now());
          setSyncState('synced');
          startRealtimeSubscription();
          return;
        }

        if (!localSummary.hasData && !alreadyBound) {
          await persistSnapshotToLocalDb(deckId, cloudRes, legacyInkKey);
          if (cancelled) return;
          callbacksRef.current.onApplySnapshot(cloudRes);
          markDeckCloudBound(uid, deckId);
          cloudReadyRef.current = true;
          setLastSyncedAt(Date.now());
          setSyncState('synced');
          startRealtimeSubscription();
          return;
        }

        if (alreadyBound) {
          const mergedCustomPages = dirtyMetaRef.current
            ? localSnapshot.customPages
            : cloudRes.customPages;
          const nextStrokes = { ...cloudRes.strokesBySlide };
          const nextSnippets = { ...cloudRes.snippetsBySlide };

          for (const dId of dirtySlidesRef.current) {
            if (localSnapshot.strokesBySlide[dId]?.length) {
              nextStrokes[dId] = localSnapshot.strokesBySlide[dId];
            } else {
              delete nextStrokes[dId];
            }
            if (localSnapshot.snippetsBySlide[dId]?.length) {
              nextSnippets[dId] = localSnapshot.snippetsBySlide[dId];
            } else {
              delete nextSnippets[dId];
            }
          }
          for (const delId of deletedSlidesRef.current) {
            delete nextStrokes[delId];
            delete nextSnippets[delId];
          }

          const finalSnap: DeckDataSnapshot = {
            strokesBySlide: nextStrokes,
            customPages: mergedCustomPages,
            snippetsBySlide: nextSnippets,
          };
          await persistSnapshotToLocalDb(deckId, finalSnap, legacyInkKey);
          if (cancelled) return;
          callbacksRef.current.onApplySnapshot(finalSnap);
          cloudReadyRef.current = true;

          if (
            dirtyMetaRef.current ||
            dirtySlidesRef.current.size > 0 ||
            deletedSlidesRef.current.size > 0
          ) {
            await flushPendingSync();
          } else {
            setLastSyncedAt(Date.now());
            setSyncState('synced');
          }
          startRealtimeSubscription();
          return;
        }

        // First bind where BOTH local & cloud contain notes -> ask user safely!
        setPendingConflict({
          info: {
            localSlideCount: localSummary.annotatedSlideCount,
            localPageCount: localSummary.customPageCount,
            cloudSlideCount: cloudSummary.annotatedSlideCount,
            cloudPageCount: cloudSummary.customPageCount,
          },
          cloud: cloudRes,
        });
        setSyncState('idle');
      } catch (err) {
        if (cancelled) return;
        setSyncState('error');
        setSyncError(
          err instanceof Error
            ? err.message
            : isEn
              ? 'Could not connect to Firestore'
              : 'ไม่สามารถเชื่อมต่อ Firestore ได้',
        );
      }
    };

    void runInitialSync();

    return () => {
      cancelled = true;
      unsubCloud?.();
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [uid, deckId, localHydrated, legacyInkKey, strokesRef, snippetsRef, customPagesRef, flushPendingSync, isEn]);

  // Flush dirty notes when coming back online or backgrounding the tab
  useEffect(() => {
    const handleOnline = () => {
      if (uid && cloudReadyRef.current) {
        void flushPendingSync();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && uid && cloudReadyRef.current) {
        void flushPendingSync();
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [uid, flushPendingSync]);

  const resolveConflict = useCallback(
    async (choice: 'merge' | 'use-cloud' | 'use-local') => {
      if (!uid || !pendingConflict) return;
      setResolvingConflict(true);
      setSyncState('syncing');
      setSyncError(null);
      try {
        const localSnap: DeckDataSnapshot = {
          strokesBySlide: strokesRef.current,
          customPages: customPagesRef.current,
          snippetsBySlide: snippetsRef.current,
        };
        let resolved: DeckDataSnapshot;
        if (choice === 'merge') {
          resolved = mergeDeckSnapshots(localSnap, pendingConflict.cloud);
          await pushEntireDeckToCloud(uid, deckId, resolved, false);
        } else if (choice === 'use-local') {
          resolved = localSnap;
          await pushEntireDeckToCloud(uid, deckId, resolved, true);
        } else {
          resolved = pendingConflict.cloud;
        }
        await persistSnapshotToLocalDb(deckId, resolved, legacyInkKey);
        callbacksRef.current.onApplySnapshot(resolved);
        markDeckCloudBound(uid, deckId);
        dirtySlidesRef.current.clear();
        deletedSlidesRef.current.clear();
        dirtyMetaRef.current = false;
        writePersistedDirty(
          uid,
          deckId,
          dirtySlidesRef.current,
          deletedSlidesRef.current,
          dirtyMetaRef.current,
        );
        setPendingConflict(null);
        cloudReadyRef.current = true;
        setLastSyncedAt(Date.now());
        setSyncState('synced');
      } catch (err) {
        setSyncState('error');
        setSyncError(
          err instanceof Error
            ? err.message
            : isEn
              ? 'Failed to resolve Cloud sync'
              : 'เกิดข้อผิดพลาดขณะผสานข้อมูลกับ Cloud',
        );
      } finally {
        setResolvingConflict(false);
      }
    },
    [uid, deckId, legacyInkKey, pendingConflict, strokesRef, customPagesRef, snippetsRef, isEn],
  );

  const cancelConflictAndSignOut = useCallback(() => {
    setPendingConflict(null);
    void signOut();
  }, [signOut]);

  const syncNow = useCallback(() => {
    if (!uid) return;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (
      !dirtyMetaRef.current &&
      dirtySlidesRef.current.size === 0 &&
      deletedSlidesRef.current.size === 0
    ) {
      setSyncState('syncing');
      void pushEntireDeckToCloud(
        uid,
        deckId,
        {
          strokesBySlide: strokesRef.current,
          customPages: customPagesRef.current,
          snippetsBySlide: snippetsRef.current,
        },
        false,
      )
        .then(() => {
          setLastSyncedAt(Date.now());
          setSyncState('synced');
        })
        .catch(() => {
          setSyncState('error');
        });
      return;
    }
    void flushPendingSync();
  }, [uid, deckId, strokesRef, customPagesRef, snippetsRef, flushPendingSync]);

  return {
    syncState: uid ? syncState : ('idle' as CloudSyncState),
    lastSyncedAt,
    syncError,
    pendingConflictInfo: pendingConflict?.info ?? null,
    resolvingConflict,
    notifySlideDirty,
    notifySlideDeleted,
    notifyMetaDirty,
    flushPendingSync,
    syncNow,
    resolveConflict,
    cancelConflictAndSignOut,
  };
}
