import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { activeHwndAtom, applyActiveWindowChangedAtom, doOnAppStartRefreshWindowInfosAtom } from "../2-1-atoms-windows-list";
import { useSnapshot } from "valtio";
import { appSettings } from "../8-ui-settings";
import { zoomLevelAtom } from "../2-6-atoms-zoom";
import { dialogOptionsOpenAtom } from "../2-ui-atoms";

export function useActiveWindow() {
    const { winlist_ActiveWinMonEnabled: activeWindowMonitoringEnabled } = useSnapshot(appSettings);
    const setActiveHwnd = useSetAtom(activeHwndAtom);
    const applyActiveWindowChanged = useSetAtom(applyActiveWindowChangedAtom);

    useEffect(
        () => {
            if (!activeWindowMonitoringEnabled) {
                setActiveHwnd(null);
                return;
            }

            // Listen for active window changes from backend
            const unsubscribe = tmApi.onActiveWindowChanged(
                (data) => {
                    void applyActiveWindowChanged(data);
                }
            );

            return unsubscribe;
        },
        [activeWindowMonitoringEnabled]);
}

export function useMonitorActiveWindow() {
    const setActiveHwnd = useSetAtom(activeHwndAtom);
    const { winlist_ActiveWinMonEnabled: activeWindowMonitoringEnabled } = useSnapshot(appSettings);

    useEffect(
        () => {
            if (!activeWindowMonitoringEnabled) {
                setActiveHwnd(null);
                try {
                    tmApi.stopMonitoring();
                } catch (e) {
                    console.error("Error stopping monitoring", e);
                    // ignore - stopMonitoring may throw if not running
                }
                return;
            }

            // Start monitoring on mount
            // Starts global "active window" monitoring (foreground window changes).
            //
            // Note on the `"0"` argument:
            // - The renderer/preload TypeScript types currently name this parameter `handle: string`,
            //   implying you can pass a specific window handle to monitor.
            // - Today, that value is **not used**: the main-process IPC handler ignores it and the
            //   native addon `startMonitoring` actually expects a callback (not a handle).
            // - We pass `"0"` as a clear placeholder/sentinel meaning "no specific target window"
            //   (i.e., just start emitting `tmApi.onActiveWindowChanged` events).

            // just temp
            tmApi.startMonitoring("0");
            return () => {
                tmApi.stopMonitoring();
            };
        },
        [activeWindowMonitoringEnabled]);
}

export function useAppStartInitialize() {
    const refreshWindowInfosOnStart = useSetAtom(doOnAppStartRefreshWindowInfosAtom);
    const setZoomLevel = useSetAtom(zoomLevelAtom);
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);

    useEffect(
        () => {
            refreshWindowInfosOnStart();
            tmApi.getZoomLevel().then(setZoomLevel).catch(() => undefined);

            const unsubscribeZoom = tmApi.onZoomChanged((level) => {
                setZoomLevel(level);
            });

            const unsubscribeOpenOptions = tmApi.onOpenOptionsShortcut(() => {
                setOptionsOpen(true);
            });

            return () => {
                unsubscribeZoom();
                unsubscribeOpenOptions();
            };
        },
        [refreshWindowInfosOnStart, setZoomLevel, setOptionsOpen]);
}
