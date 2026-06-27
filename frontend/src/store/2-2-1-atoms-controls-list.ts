import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode } from "./9-types-tmapi";
import { type RawControlNode, initializeControlTreeForHwndAtom } from "./2-2-2-atoms-controls-ini-states";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";
import { cachedWindowControlsTreeFamily, pruneExpiredControlsTreeCache, pruneOverflowControlsTreeCache, updateControlsTreeCacheMeta } from "./2-2-3-atoms-controls-cache";

//#region Control tree

export const windowControlsTreeAtom = atom<ControlNode | null>(null);    // The currently selected window's control tree.
export const windowControlsTreeHwndAtom = atom<string | null>(null);     // The handle of the currently selected window.
export const windowControlsTreeLoadingAtom = atom<boolean>(false);       // Whether the tree is currently being loaded.
export const windowControlsTreeRefreshingAtom = atom<boolean>(false);    // Whether the tree is currently being refreshed.
export const windowControlsTreeErrorAtom = atom<string | null>(null);    // The error message if the tree failed to load or refresh.

export const refreshWindowControlsTreeAtom = atom(
    null,
    async (get, set, options?: { force?: boolean; }): Promise<void> => {
        const selectedHwnd = get(selectedHwndAtom);
        if (!selectedHwnd) {
            set(windowControlsTreeLoadingAtom, false);
            set(windowControlsTreeRefreshingAtom, false);
            set(windowControlsTreeErrorAtom, null);
            set(windowControlsTreeAtom, null);
            set(windowControlsTreeHwndAtom, null);
            return;
        }

        const now = Date.now();
        pruneExpiredControlsTreeCache(set, now);

        const forceRefresh = options?.force === true;
        const cachedTree = get(cachedWindowControlsTreeFamily(selectedHwnd));
        if (!forceRefresh && cachedTree) {
            updateControlsTreeCacheMeta(selectedHwnd, now);
            set(windowControlsTreeLoadingAtom, false);
            set(windowControlsTreeRefreshingAtom, false);
            set(windowControlsTreeErrorAtom, null);
            set(windowControlsTreeAtom, cachedTree);
            set(windowControlsTreeHwndAtom, selectedHwnd);
            return;
        }

        const isShowingCurrentWindowTree = get(windowControlsTreeAtom) !== null && get(windowControlsTreeHwndAtom) === selectedHwnd;

        set(windowControlsTreeLoadingAtom, !isShowingCurrentWindowTree);
        set(windowControlsTreeRefreshingAtom, isShowingCurrentWindowTree);
        set(windowControlsTreeErrorAtom, null);

        try {
            const json = await tmApi.getControlTree(selectedHwnd);
            const rawTree = JSON.parse(json) as RawControlNode;

            const { tree, shouldContinue } = set(initializeControlTreeForHwndAtom, {rawTree, selectedHwnd});
            if (!shouldContinue) {
                return;
            }
            
            const updatedNow = Date.now();
            updateControlsTreeCacheMeta(selectedHwnd, updatedNow, updatedNow);
            pruneOverflowControlsTreeCache(set);
            set(windowControlsTreeAtom, tree);
            set(windowControlsTreeHwndAtom, selectedHwnd);
        } catch (e) {
            console.error("Failed to fetch control tree", e);
            notice.error(`Failed to fetch control tree of window (handle: ${selectedHwnd})`);
            if (get(selectedHwndAtom) === selectedHwnd) {
                set(windowControlsTreeErrorAtom, "Failed to fetch control tree");
            }
        } finally {
            if (get(selectedHwndAtom) === selectedHwnd) {
                set(windowControlsTreeLoadingAtom, false);
                set(windowControlsTreeRefreshingAtom, false);
            }
        }
    }
);

export const selectedControlAtom = atom<ControlNode | null>(null);

//#endregion Control tree
 
//#region comments

// Start monitoring this specific window if needed, or just fetch tree
// The "StartMonitoring" in API is global for "active window changes".
// If we want to show controls for the *currently selected* window in the tree, we just fetch controls.
// If we want to *track* the user's focus, we use startMonitoring.
// The requirement: "monitor active window ... and show controls inside THIS window".
// And "List of all top level windows... show windows as items tree...".
// "Clicking a window switches active monitoring to that window"?
// Or does it just show that window?
// Plan: "Clicking a window switches active monitoring to that window".
// So if user clicks a window in the tree, we act as if it's active?
// Or we just Inspect it.

// async function load() {
//     try {
//         const json = await tmApi.getControlTree(activeHandle!);
//         if (!mounted) {
//             return;
//         }
//         const tree = JSON.parse(json);
//         setControlTree(tree);
//     } catch (e) {
//         console.error("Failed to fetch control tree", e);
//     }
// }

//#endregion comments
