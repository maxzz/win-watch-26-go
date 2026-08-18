import { atom } from "jotai";
import { isBackgroundAvailable } from "@renderer/api/isBackgroundAvailable";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { hostlifeBus } from "./a-bridge";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster-in-status-bar";

const settingsStayOnTopBaseAtom = atom(appSettings.ui_stayOnTop);

export const settingsStayOnTopAtom = atom(
    (get) => get(settingsStayOnTopBaseAtom),
    (_get, set, next: boolean) => {
        set(settingsStayOnTopBaseAtom, next);
        appSettings.ui_stayOnTop = next;
    },
);

const settingsShowThemeToggleBaseAtom = atom(appSettings.ui_showThemeToggle);

export const settingsShowThemeToggleAtom = atom(
    (get) => get(settingsShowThemeToggleBaseAtom),
    (_get, set, next: boolean) => {
        set(settingsShowThemeToggleBaseAtom, next);
        appSettings.ui_showThemeToggle = next;
    },
);

export const settingsStayOnTopBaseAtomForSync = settingsStayOnTopBaseAtom;
export const settingsShowThemeToggleBaseAtomForSync = settingsShowThemeToggleBaseAtom;

const settingsRunElevatedBaseAtom = atom(false);

/** Current process elevation (admin token). */
export const appIsElevatedAtom = atom<boolean | null>(null);

export const refreshAppIsElevatedAtom = atom(
    null,
    async (_get, set) => {
        try {
            set(appIsElevatedAtom, await hostlifeBus.isElevated());
        } catch (e) {
            console.error(e);
        }
    },
);

export const settingsRunElevatedAtom = atom(
    (get) => get(settingsRunElevatedBaseAtom),
    async (get, set, next: boolean) => {
        if (!isBackgroundAvailable) {
            return;
        }
        const previous = get(settingsRunElevatedBaseAtom);
        set(settingsRunElevatedBaseAtom, next);
        try {
            await hostlifeBus.setRunElevated(next);
            if (next) {
                await hostlifeBus.requestElevationRestart();
            } else {
                await hostlifeBus.requestUnelevatedRestart();
            }
            await set(refreshAppIsElevatedAtom);
        } catch (e) {
            notice.error(`Failed to change elevation:\n ${String(e)}`);
            set(settingsRunElevatedBaseAtom, previous);
            await set(refreshAppIsElevatedAtom);
        }
    },
);

export const settingsRunElevatedBaseAtomForSync = settingsRunElevatedBaseAtom;

const settingsQuitOnCloseBaseAtom = atom(false);

export const settingsQuitOnCloseAtom = atom(
    (get) => get(settingsQuitOnCloseBaseAtom),
    (_get, set, next: boolean) => {
        set(settingsQuitOnCloseBaseAtom, next);
        hostlifeBus.setQuitOnClose(next).catch(console.error);
    },
);

export const settingsQuitOnCloseBaseAtomForSync = settingsQuitOnCloseBaseAtom;

const settingsShowInTaskbarBaseAtom = atom(true);

export const settingsShowInTaskbarAtom = atom(
    (get) => get(settingsShowInTaskbarBaseAtom),
    (_get, set, next: boolean) => {
        set(settingsShowInTaskbarBaseAtom, next);
        hostlifeBus.setShowInTaskbar(next).catch(console.error);
    },
);

export const settingsShowInTaskbarBaseAtomForSync = settingsShowInTaskbarBaseAtom;
