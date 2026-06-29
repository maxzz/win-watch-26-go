// tmApi shim: implements the renderer's `WinWatchApi` on top of the Wails
// Go bindings and the Wails runtime event bus. Assigning it to `globalThis`
// preserves the original global `tmApi` access pattern so the React code is
// unchanged.
//
// Zoom and the Ctrl+, shortcut were previously handled by the Electron main
// process. Zoom is now performed by the WebView2 engine's native page zoom
// (driven from Go via App.SetZoomLevel), and the keyboard shortcuts are wired
// up here with a keydown listener.

import {
    GetTopLevelWindows,
    GetControlTree,
    StartMonitoring,
    StopMonitoring,
    InvokeControl,
    HighlightRect,
    HideHighlight,
    GetWindowRect,
    GetControlCurrentBounds,
    IsWindowHandleValid,
    QuitApp,
} from "../../wailsjs/go/bindings/Api";
import { ToggleDevTools, SetZoomLevel, GetZoomLevel } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";

const ZOOM_STEP = 0.5;

let currentZoomLevel = 0;
const zoomListeners = new Set<(level: number) => void>();
const openOptionsListeners = new Set<() => void>();

function applyZoom(level: number): number {
    currentZoomLevel = level;
    // Zoom is performed natively by the WebView2 engine (Chrome-style page
    // zoom) via the Go side, which also persists the level for next launch.
    void SetZoomLevel(level);
    zoomListeners.forEach((listener) => listener(currentZoomLevel));
    return currentZoomLevel;
}

// Sync the in-app zoom state on startup. The native zoom factor is already
// applied by Wails (windows.ZoomFactor) from the persisted value, so here we
// only read the stored level to show the correct percentage in the controls.
function restoreZoom(): void {
    GetZoomLevel()
        .then((level) => {
            if (!Number.isFinite(level)) return;
            currentZoomLevel = level;
            zoomListeners.forEach((listener) => listener(currentZoomLevel));
        })
        .catch(() => undefined);
}

function handleZoom(action: "in" | "out" | "reset"): number {
    if (action === "in") return applyZoom(currentZoomLevel + ZOOM_STEP);
    if (action === "out") return applyZoom(currentZoomLevel - ZOOM_STEP);
    return applyZoom(0);
}

// Global shortcuts that used to live in the Electron main process.
function installShortcuts(): void {
    window.addEventListener("keydown", (event) => {
        const ctrlOrCmd = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;

        if (ctrlOrCmd && shift && (event.code === "F12" || event.code === "KeyI")) {
            ToggleDevTools().catch(console.error);
            return;
        }

        if (!ctrlOrCmd) return;

        const key = event.key;
        const normalized = key.length === 1 ? key.toLowerCase() : key;

        if (normalized === "=" || normalized === "+" || normalized === "Add") {
            handleZoom("in");
            event.preventDefault();
            return;
        }
        if (normalized === "-" || normalized === "_" || normalized === "Subtract") {
            handleZoom("out");
            event.preventDefault();
            return;
        }
        if (normalized === "0") {
            handleZoom("reset");
            event.preventDefault();
            return;
        }
        if (normalized === ",") {
            openOptionsListeners.forEach((listener) => listener());
            event.preventDefault();
        }
    });
}

const shim: WinWatchApi = {
    getTopLevelWindows: (options) => GetTopLevelWindows(!!options?.excludeOwnAppWindows),
    getControlTree: (handle) => GetControlTree(handle),
    startMonitoring: (handle) => StartMonitoring(handle),
    stopMonitoring: () => StopMonitoring(),
    invokeControl: (handle, runtimeId) => InvokeControl(handle, runtimeId),

    onActiveWindowChanged: (callback) => EventsOn("active-window-changed", (data: string) => callback(data)),

    highlightRect: (bounds, options) =>
        HighlightRect(
            bounds.left,
            bounds.top,
            bounds.right,
            bounds.bottom,
            options?.color ?? 0,
            options?.borderWidth ?? 0,
            options?.blinkCount ?? 0,
        ),
    hideHighlight: () => HideHighlight(),

    getWindowRect: (handle) => GetWindowRect(handle),
    getControlCurrentBounds: (handle, runtimeId) => GetControlCurrentBounds(handle, runtimeId),
    isWindowHandleValid: (handle) => IsWindowHandleValid(handle),

    zoomAction: (action) => Promise.resolve(handleZoom(action)),
    getZoomLevel: () => Promise.resolve(currentZoomLevel),
    onZoomChanged: (callback) => {
        zoomListeners.add(callback);
        return () => zoomListeners.delete(callback);
    },
    onOpenOptionsShortcut: (callback) => {
        openOptionsListeners.add(callback);
        return () => openOptionsListeners.delete(callback);
    },

    toggleDevTools: () => ToggleDevTools(),

    quitApp: () => QuitApp(),
};

// Install the global `tmApi` and the keyboard shortcuts. Call once at startup
// before rendering the React tree.
export function installTmApi(): void {
    (globalThis as unknown as { tmApi: WinWatchApi }).tmApi = shim;
    restoreZoom();
    installShortcuts();
}
