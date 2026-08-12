import { atom } from "jotai";
import { type PropsTab } from "./types";

const PROPS_TAB_STORAGE_KEY = "win-watch.propsTab";

function readStoredPropsTab(): PropsTab {
    try {
        const stored = localStorage.getItem(PROPS_TAB_STORAGE_KEY);
        if (stored === "general" || stored === "windowExtra" || stored === "accessibility") {
            return stored;
        }
        // Legacy traytools Class/Styles ids → Window Extra
        if (stored === "class" || stored === "styles") {
            return "windowExtra";
        }
    } catch {
        // ignore
    }
    return "accessibility";
}

const propsTabBaseAtom = atom<PropsTab>(readStoredPropsTab());

/** Active properties panel tab (persisted). */
export const propsTabAtom = atom(
    (get) => get(propsTabBaseAtom),
    (_get, set, next: PropsTab) => {
        set(propsTabBaseAtom, next);
        try {
            localStorage.setItem(PROPS_TAB_STORAGE_KEY, next);
        } catch {
            // ignore
        }
    },
);
