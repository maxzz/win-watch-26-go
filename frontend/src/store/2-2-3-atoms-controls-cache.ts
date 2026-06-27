import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { type ControlNode } from "./9-types-tmapi";

const CONTROLS_TREE_CACHE_TTL_MS = 60_000; // TTL stands for "Time To Live". 60 seconds.
const CONTROLS_TREE_CACHE_MAX_ENTRIES = 20;

type ControlsTreeCacheMeta = {
    updatedAt: number;
    lastAccessAt: number;
};

const controlsTreeCacheMetaMap = new Map<string, ControlsTreeCacheMeta>(); // Map of window handle to cache metadata.

export const cachedWindowControlsTreeFamily = atomFamily(
    (_hwnd: string) => atom<ControlNode | null>(null)
);

export function updateControlsTreeCacheMeta(hwnd: string, now: number, updatedAt?: number): void {
    controlsTreeCacheMetaMap.set(hwnd, {
        updatedAt: updatedAt ?? controlsTreeCacheMetaMap.get(hwnd)?.updatedAt ?? now,
        lastAccessAt: now,
    });
}

function removeControlsTreeCacheEntry(set: (a: any, ...args: any[]) => void, hwnd: string): void {
    controlsTreeCacheMetaMap.delete(hwnd);
    set(cachedWindowControlsTreeFamily(hwnd), null);
    cachedWindowControlsTreeFamily.remove(hwnd);
}

export function pruneExpiredControlsTreeCache(set: (a: any, ...args: any[]) => void, now: number): void {
    for (const [hwnd, meta] of controlsTreeCacheMetaMap.entries()) {
        if (now - meta.updatedAt > CONTROLS_TREE_CACHE_TTL_MS) {
            removeControlsTreeCacheEntry(set, hwnd);
        }
    }
}

export function pruneOverflowControlsTreeCache(set: (a: any, ...args: any[]) => void): void {
    if (controlsTreeCacheMetaMap.size <= CONTROLS_TREE_CACHE_MAX_ENTRIES) {
        return;
    }
    const entriesByLastAccessAsc = [...controlsTreeCacheMetaMap.entries()]
        .sort((a, b) => a[1].lastAccessAt - b[1].lastAccessAt);
    const entriesToRemoveCount = controlsTreeCacheMetaMap.size - CONTROLS_TREE_CACHE_MAX_ENTRIES;
    for (let i = 0; i < entriesToRemoveCount; i++) {
        const entry = entriesByLastAccessAsc[i];
        if (!entry) break;
        removeControlsTreeCacheEntry(set, entry[0]);
    }
}
