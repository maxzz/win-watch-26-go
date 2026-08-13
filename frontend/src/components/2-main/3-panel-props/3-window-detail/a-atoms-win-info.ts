import { atom } from "jotai";
import { appSettings } from "@renderer/store/1-ui-settings";
import { type PropsTab } from "./9-types-window-info";

const propsTabBaseAtom = atom<PropsTab>(appSettings.ui_panels_PropTab);

/** Active properties panel tab (persisted via AppSettings). */
export const propsTabAtom = atom(
    (get) => get(propsTabBaseAtom),
    (_get, set, next: PropsTab) => {
        appSettings.ui_panels_PropTab = next;
        set(propsTabBaseAtom, next);
    },
);
