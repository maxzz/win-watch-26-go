// Ambient global types for the renderer. These mirror the original Electron
// preload type surface so the React code keeps using the global `tmApi`
// unchanged after migrating to Wails.
//
// NOTE: This file must not be named to pair with a module (e.g. tmApi.d.ts
// next to tmApi.ts) or TypeScript would scope it to that module instead of
// treating these declarations as global.

type PointXY = {            // Point with 2 numbers, client or screen coordinates
    x: number;
    y: number;
};

type Rect4 = {              // Rectangle with 4 numbers, client or screen coordinates
    left: number;
    right: number;
    top: number;
    bottom: number;
};

interface HighlightBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HighlightOptions {
    color?: number;       // RGB color (e.g., 0xFF0000 for red)
    borderWidth?: number; // Border width in pixels (default: 5)
    blinkCount?: number;  // Number of blinks (0 = stay visible, default: 5)
}

// API exposed to the renderer (formerly Electron preload `tmApi`).
interface WinWatchApi {
    getTopLevelWindows: (options?: { excludeOwnAppWindows?: boolean; }) => Promise<string>;
    getControlTree: (handle: string) => Promise<string>;
    startMonitoring: (handle: string) => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    invokeControl: (handle: string, runtimeId: string) => Promise<boolean>;
    onActiveWindowChanged: (callback: (data: string) => void) => () => void;
    highlightRect: (bounds: Rect4, options?: HighlightOptions) => Promise<void>;
    hideHighlight: () => Promise<void>;
    getWindowRect: (handle: string) => Promise<string>;
    getControlCurrentBounds: (handle: string, runtimeId: string) => Promise<string>;
    isWindowHandleValid: (handle: string) => Promise<boolean>;
    zoomAction: (action: "in" | "out" | "reset") => Promise<number>;
    getZoomLevel: () => Promise<number>;
    onZoomChanged: (callback: (level: number) => void) => () => void;
    onOpenOptionsShortcut: (callback: () => void) => () => void;
    quitApp: () => Promise<void>;
}

declare var tmApi: WinWatchApi;
