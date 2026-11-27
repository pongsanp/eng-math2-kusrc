import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { CustomBlankPage, InkStroke, SlideSnippet } from '../slides/inkUtils';
import { getFirebaseServices } from './client';

export interface DeckDataSnapshot {
  strokesBySlide: Record<number, InkStroke[]>;
  customPages: CustomBlankPage[];
  snippetsBySlide: Record<number, SlideSnippet[]>;
}

export interface CloudDeckFetchResult {
  hasCloudData: boolean;
  strokesBySlide: Record<number, InkStroke[]>;
  customPages: CustomBlankPage[];
  snippetsBySlide: Record<number, SlideSnippet[]>;
  updatedAt: number;
}

interface CloudInkStroke {
  color: string;
  width: number;
  isEraser?: boolean;
  isHighlighter?: boolean;
  sharp?: boolean;
  pressures?: number[];
  pts: number[];
}

interface CloudDeckMetaDoc {
  customPages?: CustomBlankPage[];
  updatedAt?: number;
  deviceId?: string;
}

interface CloudSlideDoc {
  slideId: number;
  strokes?: CloudInkStroke[];
  snippets?: SlideSnippet[];
  updatedAt?: number;
  deviceId?: string;
}

const DEVICE_ID_STORAGE_KEY = 'eng_math_2_device_id_v1';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `dev_${Date.now().toString(36)}`;
  }
}

export function cloudBoundKey(uid: string, deckId: string): string {
  return `eng_math_2_cloud_bound_${uid}_${deckId}`;
}

export function isDeckCloudBound(uid: string, deckId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(cloudBoundKey(uid, deckId)) === '1';
  } catch {
    return false;
  }
}

export function markDeckCloudBound(uid: string, deckId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cloudBoundKey(uid, deckId), '1');
  } catch {
    // Ignore storage quota errors
  }
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        result[key] = stripUndefinedDeep(val);
      }
    }
    return result as T;
  }
  return value;
}

function roundCoord(n: number): number {
  return Math.round(n * 100000) / 100000;
}

function serializeStrokeForCloud(stroke: InkStroke): CloudInkStroke {
  const pts: number[] = [];
  for (const pt of stroke.points) {
    if (Array.isArray(pt) && pt.length >= 2) {
      pts.push(roundCoord(pt[0]), roundCoord(pt[1]));
    }
  }
  const out: CloudInkStroke = {
    color: stroke.color,
    width: stroke.width,
    pts,
  };
  if (stroke.isEraser) out.isEraser = true;
  if (stroke.isHighlighter) out.isHighlighter = true;
  if (stroke.sharp) out.sharp = true;
  if (Array.isArray(stroke.pressures) && stroke.pressures.length > 0) {
    out.pressures = stroke.pressures.map((p) => Math.round(p * 1000) / 1000);
  }
  return out;
}

function deserializeStrokeFromCloud(raw: unknown): InkStroke | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<CloudInkStroke> & { points?: unknown };
  if (typeof obj.color !== 'string' || typeof obj.width !== 'number') return null;

  const points: Array<[number, number]> = [];
  if (Array.isArray(obj.pts)) {
    for (let i = 0; i + 1 < obj.pts.length; i += 2) {
      const x = Number(obj.pts[i]);
      const y = Number(obj.pts[i + 1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push([x, y]);
      }
    }
  } else if (Array.isArray(obj.points)) {
    for (const pt of obj.points) {
      if (Array.isArray(pt) && pt.length >= 2) {
        points.push([Number(pt[0]), Number(pt[1])]);
      }
    }
  }
  if (points.length === 0) return null;

  const stroke: InkStroke = {
    color: obj.color,
    width: obj.width,
    points,
  };
  if (obj.isEraser) stroke.isEraser = true;
  if (obj.isHighlighter) stroke.isHighlighter = true;
  if (obj.sharp) stroke.sharp = true;
  if (Array.isArray(obj.pressures) && obj.pressures.length > 0) {
    stroke.pressures = obj.pressures.map((p) => Number(p));
  }
  return stroke;
}

function deserializeStrokesList(rawList: unknown): InkStroke[] {
  if (!Array.isArray(rawList)) return [];
  const out: InkStroke[] = [];
  for (const item of rawList) {
    const parsed = deserializeStrokeFromCloud(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

function deserializeSnippetsList(rawList: unknown): SlideSnippet[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.filter(
    (s): s is SlideSnippet =>
      Boolean(s) &&
      typeof s === 'object' &&
      typeof (s as Partial<SlideSnippet>).id === 'string' &&
      typeof (s as Partial<SlideSnippet>).x === 'number' &&
      typeof (s as Partial<SlideSnippet>).y === 'number',
  );
}

function sanitizeCloudCustomPages(rawList: unknown): CustomBlankPage[] {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<number>();
  const out: CustomBlankPage[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Partial<CustomBlankPage>;
    if (
      typeof p.id !== 'number' ||
      !Number.isFinite(p.id) ||
      p.id >= 0 ||
      seen.has(p.id) ||
      typeof p.afterSlideId !== 'number'
    ) {
      continue;
    }
    seen.add(p.id);
    out.push({
      id: p.id,
      afterSlideId: p.afterSlideId,
      order: typeof p.order === 'number' ? p.order : 0,
      lecture: p.lecture === 2 ? 2 : 1,
      paperStyle:
        p.paperStyle === 'lined' || p.paperStyle === 'blank' ? p.paperStyle : 'grid',
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
    });
  }
  return out;
}

export function summarizeDeckData(data: DeckDataSnapshot): {
  hasData: boolean;
  annotatedSlideCount: number;
  customPageCount: number;
  snippetCount: number;
} {
  let annotatedSlideCount = 0;
  for (const list of Object.values(data.strokesBySlide)) {
    if (Array.isArray(list) && list.length > 0) annotatedSlideCount += 1;
  }
  let snippetCount = 0;
  for (const list of Object.values(data.snippetsBySlide)) {
    if (Array.isArray(list)) snippetCount += list.length;
  }
  const customPageCount = data.customPages.length;
  return {
    hasData: annotatedSlideCount > 0 || customPageCount > 0 || snippetCount > 0,
    annotatedSlideCount,
    customPageCount,
    snippetCount,
  };
}

function strokeFingerprint(st: InkStroke): string {
  const first = st.points[0] ?? [0, 0];
  const last = st.points[st.points.length - 1] ?? [0, 0];
  return `${st.color}|${st.width}|${st.isHighlighter ? 1 : 0}|${st.isEraser ? 1 : 0}|${st.points.length}|${first[0].toFixed(4)},${first[1].toFixed(4)}|${last[0].toFixed(4)},${last[1].toFixed(4)}`;
}

export function mergeDeckSnapshots(
  local: DeckDataSnapshot,
  cloud: DeckDataSnapshot,
): DeckDataSnapshot {
  const mergedStrokes: Record<number, InkStroke[]> = { ...cloud.strokesBySlide };
  for (const [k, localList] of Object.entries(local.strokesBySlide)) {
    const sId = Number(k);
    if (!Number.isFinite(sId)) continue;
    const cloudList = mergedStrokes[sId] ?? [];
    if (cloudList.length === 0) {
      if (localList.length > 0) mergedStrokes[sId] = [...localList];
      continue;
    }
    const seen = new Set(cloudList.map(strokeFingerprint));
    const uniqueLocal = localList.filter((st) => !seen.has(strokeFingerprint(st)));
    mergedStrokes[sId] = [...cloudList, ...uniqueLocal];
  }

  const pageMap = new Map<number, CustomBlankPage>();
  for (const p of cloud.customPages) pageMap.set(p.id, p);
  for (const p of local.customPages) {
    if (!pageMap.has(p.id)) pageMap.set(p.id, p);
  }
  const mergedPages = Array.from(pageMap.values()).sort(
    (a, b) => a.afterSlideId - b.afterSlideId || a.order - b.order || a.createdAt - b.createdAt,
  );

  const mergedSnippets: Record<number, SlideSnippet[]> = { ...cloud.snippetsBySlide };
  for (const [k, localSnips] of Object.entries(local.snippetsBySlide)) {
    const sId = Number(k);
    if (!Number.isFinite(sId)) continue;
    const cloudSnips = mergedSnippets[sId] ?? [];
    const seenIds = new Set(cloudSnips.map((s) => s.id));
    mergedSnippets[sId] = [...cloudSnips, ...localSnips.filter((s) => !seenIds.has(s.id))];
  }

  return {
    strokesBySlide: mergedStrokes,
    customPages: mergedPages,
    snippetsBySlide: mergedSnippets,
  };
}

export async function fetchCloudDeck(uid: string, deckId: string): Promise<CloudDeckFetchResult> {
  const services = getFirebaseServices();
  if (!services) {
    return {
      hasCloudData: false,
      strokesBySlide: {},
      customPages: [],
      snippetsBySlide: {},
      updatedAt: 0,
    };
  }
  const { db } = services;
  const metaRef = doc(db, 'users', uid, 'decks', deckId);
  const slidesColRef = collection(db, 'users', uid, 'decks', deckId, 'slides');

  const [metaSnap, slidesSnap] = await Promise.all([getDoc(metaRef), getDocs(slidesColRef)]);

  const metaData = metaSnap.exists() ? (metaSnap.data() as CloudDeckMetaDoc) : null;
  const customPages = metaData ? sanitizeCloudCustomPages(metaData.customPages) : [];

  const strokesBySlide: Record<number, InkStroke[]> = {};
  const snippetsBySlide: Record<number, SlideSnippet[]> = {};

  for (const slideDoc of slidesSnap.docs) {
    const data = slideDoc.data() as Partial<CloudSlideDoc>;
    const slideId =
      typeof data.slideId === 'number' && Number.isFinite(data.slideId)
        ? data.slideId
        : Number(slideDoc.id);
    if (!Number.isFinite(slideId)) continue;

    const strokes = deserializeStrokesList(data.strokes);
    if (strokes.length > 0) {
      strokesBySlide[slideId] = strokes;
    }
    const snippets = deserializeSnippetsList(data.snippets);
    if (snippets.length > 0) {
      snippetsBySlide[slideId] = snippets;
    }
  }

  const summary = summarizeDeckData({ strokesBySlide, customPages, snippetsBySlide });
  return {
    hasCloudData: metaSnap.exists() && (summary.hasData || !slidesSnap.empty),
    strokesBySlide,
    customPages,
    snippetsBySlide,
    updatedAt: typeof metaData?.updatedAt === 'number' ? metaData.updatedAt : 0,
  };
}

export async function pushEntireDeckToCloud(
  uid: string,
  deckId: string,
  data: DeckDataSnapshot,
  clearMissingSlides = false,
): Promise<void> {
  const services = getFirebaseServices();
  if (!services) return;
  const { db } = services;
  const deviceId = getOrCreateDeviceId();
  const now = Date.now();

  const slideIds = new Set<number>();
  for (const [k, list] of Object.entries(data.strokesBySlide)) {
    const id = Number(k);
    if (Number.isFinite(id) && list.length > 0) slideIds.add(id);
  }
  for (const [k, list] of Object.entries(data.snippetsBySlide)) {
    const id = Number(k);
    if (Number.isFinite(id) && list.length > 0) slideIds.add(id);
  }

  let existingCloudSlideIds: number[] = [];
  if (clearMissingSlides) {
    const slidesSnap = await getDocs(collection(db, 'users', uid, 'decks', deckId, 'slides'));
    existingCloudSlideIds = slidesSnap.docs
      .map((d) => Number(d.id))
      .filter((id) => Number.isFinite(id) && !slideIds.has(id));
  }

  type Op =
    | { kind: 'meta' }
    | { kind: 'setSlide'; slideId: number }
    | { kind: 'deleteSlide'; slideId: number };

  const ops: Op[] = [{ kind: 'meta' }];
  for (const slideId of slideIds) {
    ops.push({ kind: 'setSlide', slideId });
  }
  for (const slideId of existingCloudSlideIds) {
    ops.push({ kind: 'deleteSlide', slideId });
  }

  // Commit in chunks safely under Firestore's 500 writes/batch limit
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.kind === 'meta') {
        const metaRef = doc(db, 'users', uid, 'decks', deckId);
        batch.set(
          metaRef,
          stripUndefinedDeep({
            customPages: data.customPages,
            updatedAt: now,
            deviceId,
          }),
          { merge: true },
        );
      } else if (op.kind === 'setSlide') {
        const slideRef = doc(db, 'users', uid, 'decks', deckId, 'slides', String(op.slideId));
        const strokes = (data.strokesBySlide[op.slideId] ?? []).map(serializeStrokeForCloud);
        const snippets = data.snippetsBySlide[op.slideId] ?? [];
        batch.set(
          slideRef,
          stripUndefinedDeep({
            slideId: op.slideId,
            strokes,
            snippets,
            updatedAt: now,
            deviceId,
          }),
        );
      } else {
        const slideRef = doc(db, 'users', uid, 'decks', deckId, 'slides', String(op.slideId));
        batch.delete(slideRef);
      }
    }
    await batch.commit();
  }
}

export async function pushDeckDeltaToCloud(
  uid: string,
  deckId: string,
  params: {
    dirtySlideIds: number[];
    deletedSlideIds: number[];
    dirtyMeta: boolean;
    strokesBySlide: Record<number, InkStroke[]>;
    snippetsBySlide: Record<number, SlideSnippet[]>;
    customPages: CustomBlankPage[];
  },
): Promise<void> {
  const services = getFirebaseServices();
  if (!services) return;
  const { db } = services;
  const deviceId = getOrCreateDeviceId();
  const now = Date.now();

  if (
    !params.dirtyMeta &&
    params.dirtySlideIds.length === 0 &&
    params.deletedSlideIds.length === 0
  ) {
    return;
  }

  const batch = writeBatch(db);

  if (params.dirtyMeta) {
    const metaRef = doc(db, 'users', uid, 'decks', deckId);
    batch.set(
      metaRef,
      stripUndefinedDeep({
        customPages: params.customPages,
        updatedAt: now,
        deviceId,
      }),
      { merge: true },
    );
  }

  for (const slideId of params.dirtySlideIds) {
    const slideRef = doc(db, 'users', uid, 'decks', deckId, 'slides', String(slideId));
    const strokes = (params.strokesBySlide[slideId] ?? []).map(serializeStrokeForCloud);
    const snippets = params.snippetsBySlide[slideId] ?? [];
    batch.set(
      slideRef,
      stripUndefinedDeep({
        slideId,
        strokes,
        snippets,
        updatedAt: now,
        deviceId,
      }),
    );
  }

  for (const slideId of params.deletedSlideIds) {
    const slideRef = doc(db, 'users', uid, 'decks', deckId, 'slides', String(slideId));
    batch.delete(slideRef);
  }

  await batch.commit();
}

export async function deleteCloudSlideDoc(
  uid: string,
  deckId: string,
  slideId: number,
): Promise<void> {
  const services = getFirebaseServices();
  if (!services) return;
  await deleteDoc(doc(services.db, 'users', uid, 'decks', deckId, 'slides', String(slideId)));
}

export interface CloudDeckSubscriptionHandlers {
  onRemoteMeta: (customPages: CustomBlankPage[]) => void;
  onRemoteSlideChange: (slideId: number, strokes: InkStroke[], snippets: SlideSnippet[]) => void;
  onRemoteSlideRemove: (slideId: number) => void;
  onError?: (err: unknown) => void;
}

export function subscribeCloudDeck(
  uid: string,
  deckId: string,
  handlers: CloudDeckSubscriptionHandlers,
): Unsubscribe {
  const services = getFirebaseServices();
  if (!services) return () => {};
  const { db } = services;
  const localDeviceId = getOrCreateDeviceId();

  const metaRef = doc(db, 'users', uid, 'decks', deckId);
  const slidesColRef = collection(db, 'users', uid, 'decks', deckId, 'slides');

  let initialMetaSkipped = false;
  const unsubMeta = onSnapshot(
    metaRef,
    (snap) => {
      if (!initialMetaSkipped) {
        initialMetaSkipped = true;
        return;
      }
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      const data = snap.data() as CloudDeckMetaDoc;
      if (data.deviceId === localDeviceId) return;
      handlers.onRemoteMeta(sanitizeCloudCustomPages(data.customPages));
    },
    (err) => {
      handlers.onError?.(err);
    },
  );

  let initialSlidesSkipped = false;
  const unsubSlides = onSnapshot(
    slidesColRef,
    (snap) => {
      if (!initialSlidesSkipped) {
        initialSlidesSkipped = true;
        return;
      }
      if (snap.metadata.hasPendingWrites) return;
      for (const change of snap.docChanges()) {
        const slideId = Number(change.doc.id);
        if (!Number.isFinite(slideId)) continue;
        if (change.type === 'removed') {
          handlers.onRemoteSlideRemove(slideId);
          continue;
        }
        const data = change.doc.data() as Partial<CloudSlideDoc>;
        if (data.deviceId === localDeviceId) continue;
        handlers.onRemoteSlideChange(
          slideId,
          deserializeStrokesList(data.strokes),
          deserializeSnippetsList(data.snippets),
        );
      }
    },
    (err) => {
      handlers.onError?.(err);
    },
  );

  return () => {
    unsubMeta();
    unsubSlides();
  };
}
