import { proxy, subscribe } from "valtio";
import { atom } from "jotai";
import { type ThemeMode, themeApplyMode } from "../utils/theme-apply";
import type { Layout } from "react-resizable-panels";

const STORE_KEY = "win-watch-25";
const STORE_VER = "v1.0";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

type PropertiesPanelPosition = 'bottom' | 'right';
type PanelId = "left-panel" | "right-panel" | "controls-panel" | "control-props-panel";
type PanelLayout = Record<PanelId, number>;

export interface AppSettings {
    winlist_ActiveWinMonEnabled: boolean;       // Whether to monitor the active window
    winlist_ExcludeUs: boolean;                 // Whether to exclude the own app windows from the window list
    winlist_SortWindows: boolean;               // Whether to sort the window list by process name
    controls_AutoHighlight: boolean;            // Whether to auto highlight the selected control
    controls_highlightBlinks: number;           // The number of blinks for the highlight
    controls_highlightBorderWidth: number;      // Border width used for the highlight rectangle
    controls_highlightBorderColor: string;      // Border color used for the highlight rectangle (hex)
    controls_ShowEmptyBoundsNotice: boolean;    // Whether to show a notification when the selected control bounds are empty
    ui_showFooter: boolean;                     // Whether to show the footer
    ui_theme: ThemeMode;                        // The theme: 'light' or 'dark'
    ui_panels_Layout: PanelLayout;              // Panel sizes (percentages) 
    ui_panels_PropPos: PropertiesPanelPosition; // The position of the properties panel: 'bottom' or 'right'
}

const DEFAULT_SETTINGS: AppSettings = {
    winlist_ActiveWinMonEnabled: false,
    winlist_ExcludeUs: true,
    winlist_SortWindows: true,
    controls_AutoHighlight: true,
    controls_highlightBlinks: 3,
    controls_highlightBorderWidth: 2,
    controls_highlightBorderColor: "#ff0000",
    controls_ShowEmptyBoundsNotice: true,
    ui_showFooter: true,
    ui_theme: "light",
    ui_panels_Layout: {
        "left-panel": 25,
        "right-panel": 75,
        "controls-panel": 70,
        "control-props-panel": 30,
    },
    ui_panels_PropPos: 'right',
};

// Load settings from localStorage

function loadSettings(): AppSettings {
    try {
        const stored = localStorage.getItem(STORAGE_ID);
        if (stored) {
            // merge stored settings with defaults to ensure new fields are present
            const rv =  { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            return rv;
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return { ...DEFAULT_SETTINGS };
}

export const appSettings = proxy<AppSettings>(loadSettings());

themeApplyMode(appSettings.ui_theme);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.ui_theme);
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
});

// Jotai atom setter for panel layout
export const setPanelLayoutAtom = atom(
    null,
    (get, set, layout: Layout) => {
        for (const [key, value] of Object.entries(layout)) {
            appSettings.ui_panels_Layout[key as PanelId] = value;
        }
    }
);
