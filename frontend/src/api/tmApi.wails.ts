// Wails-backed tmApi: maps WinWatchApi onto generated bindings and runtime events.

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

// Serialize Go zoom calls so rapid clicks stay ordered (apply + persist).
let zoomChain: Promise<unknown> = Promise.resolve();

function applyZoom(level: number): number {
    currentZoomLevel = level;
    zoomChain = zoomChain.then(() => SetZoomLevel(level)).catch(() => undefined);
    zoomListeners.forEach((listener) => listener(currentZoomLevel));
    return currentZoomLevel;
}

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

export function createWailsTmApi(): WinWatchApi {
    return {
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
}

export function installWailsTmApiExtras(): void {
    restoreZoom();
    installShortcuts();
}
