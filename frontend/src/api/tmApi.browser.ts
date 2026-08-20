// Browser-only tmApi stub for Vite dev / static preview without the Wails .exe.
// Native UIA, highlight, and monitoring are no-ops; zoom and keyboard shortcuts
// still work via CSS zoom so the UI can be styled and exercised in a browser.

const ZOOM_STEP = 0.5;
const ZOOM_STORAGE_KEY = "winwatch-browser-zoom-level";

let currentZoomLevel = 0;
const zoomListeners = new Set<(level: number) => void>();
const openOptionsListeners = new Set<() => void>();
const browserPickerListeners = new Set<(data: string) => void>();

let browserPickerCleanup: (() => void) | null = null;

function emitBrowserPicker(event: MouseEvent, released: boolean): void {
    const payload = JSON.stringify({
        released,
        processName: "browser-preview",
        screen: { x: event.screenX, y: event.screenY },
        client: { x: event.clientX, y: event.clientY },
    });
    browserPickerListeners.forEach((listener) => listener(payload));
}

function stopBrowserWindowPicker(): Promise<boolean> {
    if (browserPickerCleanup) {
        browserPickerCleanup();
        browserPickerCleanup = null;
        return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

function startBrowserWindowPicker(): Promise<boolean> {
    void stopBrowserWindowPicker();

    const onMove = (event: MouseEvent) => emitBrowserPicker(event, false);
    const onUp = (event: MouseEvent) => {
        emitBrowserPicker(event, true);
        void stopBrowserWindowPicker();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    browserPickerCleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        browserPickerCleanup = null;
    };
    return Promise.resolve(true);
}

function readStoredZoomLevel(): number {
    try {
        const raw = localStorage.getItem(ZOOM_STORAGE_KEY);
        if (raw === null) return 0;
        const level = Number(raw);
        return Number.isFinite(level) ? level : 0;
    } catch {
        return 0;
    }
}

function persistZoomLevel(level: number): void {
    try {
        localStorage.setItem(ZOOM_STORAGE_KEY, String(level));
    } catch {
        // ignore quota / private-mode errors
    }
}

function applyCssZoom(level: number): void {
    const factor = Math.pow(1.2, level);
    document.documentElement.style.zoom = factor === 1 ? "" : String(factor);
}

function applyZoom(level: number): number {
    currentZoomLevel = level;
    applyCssZoom(level);
    persistZoomLevel(level);
    zoomListeners.forEach((listener) => listener(currentZoomLevel));
    return currentZoomLevel;
}

function handleZoom(action: "in" | "out" | "reset"): number {
    if (action === "in") return applyZoom(currentZoomLevel + ZOOM_STEP);
    if (action === "out") return applyZoom(currentZoomLevel - ZOOM_STEP);
    return applyZoom(0);
}

function installShortcuts(): void {
    window.addEventListener("keydown", (event) => {
        const ctrlOrCmd = event.ctrlKey || event.metaKey;
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

function restoreZoom(): void {
    currentZoomLevel = readStoredZoomLevel();
    applyCssZoom(currentZoomLevel);
    zoomListeners.forEach((listener) => listener(currentZoomLevel));
}

export function createBrowserTmApi(): WinWatchApi {
    return {
        getTopLevelWindows: async () => "[]",
        getControlTree: async () => "null",
        startMonitoring: async () => false,
        stopMonitoring: async () => false,
        invokeControl: async () => false,

        onActiveWindowChanged: () => () => undefined,

        highlightRect: async () => undefined,
        hideHighlight: async () => undefined,

        getWindowRect: async () => "null",
        getWindowDetailInfo: async () => JSON.stringify({ valid: false }),
        getControlCurrentBounds: async () => "null",
        getControlAccInteract: async () => JSON.stringify({
            found: false,
            error: "UI Automation is not available in the browser preview",
            uia: { properties: [], actions: [], patterns: [] },
            msaa: { available: false, properties: [], stateValue: 0, stateFlags: [], actions: [] },
        }),
        executeAccAction: async () => JSON.stringify({ ok: false, error: "not available in browser preview" }),
        isWindowHandleValid: async () => false,
        revealInExplorer: async () => undefined,
        getFileIcons: async () => "[]",

        startWindowPicker: (_iconMode?: string) => startBrowserWindowPicker(),
        stopWindowPicker: () => stopBrowserWindowPicker(),
        onWindowPickerEvent: (callback) => {
            browserPickerListeners.add(callback);
            return () => browserPickerListeners.delete(callback);
        },

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

        toggleDevTools: async () => undefined,
        quitApp: async () => undefined,
    };
}

export function installBrowserTmApiExtras(): void {
    restoreZoom();
    installShortcuts();
}
