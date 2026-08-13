import { atom } from "jotai";
import { appSettings } from "../8-ui-settings";
import { type PropsTab } from "./types";

const propsTabBaseAtom = atom<PropsTab>(appSettings.ui_panels_PropTab);

/** Active properties panel tab (persisted via AppSettings). */
export const propsTabAtom = atom(
    (get) => get(propsTabBaseAtom),
    (_get, set, next: PropsTab) => {
        appSettings.ui_panels_PropTab = next;
        set(propsTabBaseAtom, next);
    },
);
