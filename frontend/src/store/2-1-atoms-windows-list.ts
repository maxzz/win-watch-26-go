import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { areWindowHandlesEqual } from "@renderer/utils/win32/handles";
import { type WindowInfo } from "./9-types-tmapi";
import { appSettings } from "./8-ui-settings";

//#region Window list

export const windowInfosAtom = atom<WindowInfo[]>([]);
export const windowInfosLoadingAtom = atom<boolean>(false);

export const doRefreshWindowInfosAtom = atom(
    null,
    async (_get, set): Promise<void> => {
        set(windowInfosLoadingAtom, true);
        try {
            const json = await tmApi.getTopLevelWindows({
                excludeOwnAppWindows: appSettings.winlist_ExcludeUs,
            });
            const data = JSON.parse(json) as WindowInfo[];
            set(windowInfosAtom, getWindowInfosWithAppliedSort(data));
        } catch (e) {
            notice.error("Failed to fetch windows");
            console.error("Failed to fetch windows", e);
        } finally {
            set(windowInfosLoadingAtom, false);
        }
    }
);

export const ensureWindowInListAtom = atom(
    null,
    (get, set, window: Partial<WindowInfo> & { handle: string; }): void => {
        const current = get(windowInfosAtom);
        const alreadyExists = current.some((w) => areWindowHandlesEqual(w.handle, window.handle));
        if (alreadyExists) {
            return;
        }

        const synthetic: WindowInfo = {
            handle: window.handle,
            title: window.title ?? "",
            processName: window.processName ?? "",
            processId: window.processId ?? 0,
            className: window.className ?? "",
            rect: window.rect ?? { left: 0, top: 0, right: 0, bottom: 0 },
            children: window.children,
        };
        set(windowInfosAtom, getWindowInfosWithAppliedSort([synthetic, ...current]));
    }
);

export const setExcludeOwnAppWindowsAtom = atom(
    null,
    async (get, set, enabled: boolean): Promise<void> => {
        appSettings.winlist_ExcludeUs = enabled;
        await set(doRefreshWindowInfosAtom);

        const windows = get(windowInfosAtom);
        const selected = get(selectedHwndAtom);
        if (!selected) {
            return;
        }

        const selectedStillExists = windows.some((w) => areWindowHandlesEqual(w.handle, selected));
        if (selectedStillExists) {
            return;
        }

        const active = get(activeHwndAtom);
        const activeInList = active ? windows.find((w) => areWindowHandlesEqual(w.handle, active)) : undefined;
        const next = activeInList?.handle ?? windows[0]?.handle ?? null;
        set(selectedHwndAtom, next);
        set(activeHwndAtom, next);
    }
);

export const setSortWindowsByProcessNameAtom = atom(
    null,
    async (_get, set, enabled: boolean): Promise<void> => {
        appSettings.winlist_SortWindows = enabled;
        await set(doRefreshWindowInfosAtom);
    }
);

// Call this on app startup. It guarantees we only fetch the initial window list once,
// even if the React tree mounts twice in dev (StrictMode).
let didRefreshWindowInfosOnAppStart = false;
export const doOnAppStartRefreshWindowInfosAtom = atom(
    null,
    (_get, set): void => {
        if (!didRefreshWindowInfosOnAppStart) {
            didRefreshWindowInfosOnAppStart = true;
            set(doRefreshWindowInfosAtom);
        }
    }
);

export const activeHwndAtom = atom<string | null>(null);
export const selectedHwndAtom = atom<string | null>(null);

export const applyActiveWindowChangedAtom = atom(
    null,
    async (get, set, payloadJson: string): Promise<void> => {
        let info: Partial<WindowInfo> & { handle?: unknown; };
        try {
            info = JSON.parse(payloadJson);
        } catch (e) {
            console.error("Error parsing active window update", e);
            notice.error("Error parsing active window update");
            set(activeHwndAtom, null);
            return;
        }

        const incomingHandle = typeof info?.handle === "string" ? info.handle : null;
        if (!incomingHandle) return;

        const previousActive = get(activeHwndAtom);
        const excludeOwnAppWindows = appSettings.winlist_ExcludeUs;
        const windows = get(windowInfosAtom);
        const matchedWindow = windows.find((w) => areWindowHandlesEqual(w.handle, incomingHandle));
        let selectedHandle: string | null = matchedWindow?.handle ?? incomingHandle;

        // Keep UI focused on the new active window immediately unless exclusion is enabled
        // and this handle is not part of the filtered list (it might be our own app window).
        if (!(excludeOwnAppWindows && !matchedWindow)) {
            set(activeHwndAtom, selectedHandle);
            set(selectedHwndAtom, selectedHandle);
        }

        const activeChanged =
            previousActive === null
                ? true
                : !areWindowHandlesEqual(previousActive, incomingHandle);

        let previousHandleBecameInvalid = false;
        if (activeChanged && previousActive) {
            try {
                previousHandleBecameInvalid = !(await tmApi.isWindowHandleValid(previousActive));
            } catch (e) {
                console.warn(`Failed to validate previous active window handle: ${previousActive}`, e);
            }
        }

        const shouldRefreshList = !matchedWindow || previousHandleBecameInvalid;
        if (!shouldRefreshList) {
            return;
        }

        if (!matchedWindow && !excludeOwnAppWindows) {
            set(ensureWindowInListAtom, {
                handle: incomingHandle,
                title: typeof info.title === "string" ? info.title : "",
                processName: typeof info.processName === "string" ? info.processName : "",
                processId: typeof info.processId === "number" ? info.processId : 0,
                className: typeof info.className === "string" ? info.className : "",
            });
        }

        await set(doRefreshWindowInfosAtom);
        const refreshed = get(windowInfosAtom);
        const refreshedMatch = refreshed.find((w) => areWindowHandlesEqual(w.handle, incomingHandle));

        if (excludeOwnAppWindows) {
            // With exclusion enabled, if active handle is not present after refresh,
            // pick the topmost remaining window (second-active behavior).
            selectedHandle = refreshedMatch?.handle ?? refreshed[0]?.handle ?? null;
        } else {
            selectedHandle = refreshedMatch?.handle ?? selectedHandle;
        }

        set(activeHwndAtom, selectedHandle);
        set(selectedHwndAtom, selectedHandle);
    }
);

//#region sort windows list

function getWindowInfosWithAppliedSort(windowInfos: WindowInfo[]): WindowInfo[] {
    if (!appSettings.winlist_SortWindows) {
        return windowInfos;
    }
    return sortWindowInfosByProcessName(windowInfos);
}

function sortWindowInfosByProcessName(windowInfos: WindowInfo[]): WindowInfo[] {
    return windowInfos
        .map(
            (windowInfo) => ({
                ...windowInfo,
                children: windowInfo.children ? sortWindowInfosByProcessName(windowInfo.children) : undefined,
            })
        )
        .sort(
            (a, b) => {
                const processNameComparison = (a.processName ?? "").localeCompare(b.processName ?? "", undefined, { sensitivity: "base" });

                if (processNameComparison !== 0) {
                    return processNameComparison;
                }

                const titleComparison = (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: "base" });
                if (titleComparison !== 0) {
                    return titleComparison;
                }
                
                return (a.handle ?? "").localeCompare(b.handle ?? "", undefined, { sensitivity: "base" });
            }
        );
}

//#endregion sort windows list

//#endregion Window list
