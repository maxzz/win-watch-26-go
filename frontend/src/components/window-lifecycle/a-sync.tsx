import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { subscribe } from "valtio";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster-in-status-bar";
import { hostlifeBus } from "./a-bridge";
import {
    refreshAppIsElevatedAtom,
    settingsQuitOnCloseBaseAtomForSync,
    settingsRunElevatedBaseAtomForSync,
    settingsShowInTaskbarBaseAtomForSync,
    settingsShowThemeToggleBaseAtomForSync,
    settingsStayOnTopBaseAtomForSync,
} from "./a-atoms";

function SettingsRunElevatedSync() {
    const setRunElevated = useSetAtom(settingsRunElevatedBaseAtomForSync);

    useEffect(
        () => {
            hostlifeBus.getRunElevated().then(setRunElevated).catch((e) => {
                notice.error(`Failed to load "Run elevated" setting:\n ${String(e)}`);
            });
        },
        [setRunElevated],
    );

    return null;
}

function AppIsElevatedSync() {
    const refresh = useSetAtom(refreshAppIsElevatedAtom);

    useEffect(
        () => {
            void refresh();
        },
        [refresh],
    );

    return null;
}

function SettingsQuitOnCloseSync() {
    const setQuitOnClose = useSetAtom(settingsQuitOnCloseBaseAtomForSync);

    useEffect(
        () => {
            hostlifeBus.getQuitOnClose().then(setQuitOnClose).catch((e) => {
                notice.error(`Failed to load "Quit on close" setting:\n ${String(e)}`);
            });
        },
        [setQuitOnClose],
    );

    return null;
}

function SettingsShowInTaskbarSync() {
    const setShowInTaskbar = useSetAtom(settingsShowInTaskbarBaseAtomForSync);

    useEffect(
        () => {
            hostlifeBus.getShowInTaskbar().then(setShowInTaskbar).catch((e) => {
                notice.error(`Failed to load "Show in taskbar" setting:\n ${String(e)}`);
            });
        },
        [setShowInTaskbar],
    );

    return null;
}

/** Keep Jotai wrappers aligned when the header stay-on-top / theme buttons write Valtio. */
function SettingsUiPrefsSync() {
    const setStayOnTop = useSetAtom(settingsStayOnTopBaseAtomForSync);
    const setShowThemeToggle = useSetAtom(settingsShowThemeToggleBaseAtomForSync);

    useEffect(
        () => {
            return subscribe(appSettings, () => {
                setStayOnTop(appSettings.ui_stayOnTop);
                setShowThemeToggle(appSettings.ui_showThemeToggle);
            });
        },
        [setStayOnTop, setShowThemeToggle],
    );

    return null;
}

/** Mount once at app root to load host-lifecycle settings from the backend. */
export function WindowLifecycleSync() {
    return (<>
        <AppIsElevatedSync />
        <SettingsRunElevatedSync />
        <SettingsQuitOnCloseSync />
        <SettingsShowInTaskbarSync />
        <SettingsUiPrefsSync />
    </>);
}
