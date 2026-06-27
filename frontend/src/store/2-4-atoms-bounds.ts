import { atom, getDefaultStore } from "jotai";
import { appSettings } from "./8-ui-settings";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode, type NativeBounds } from "./9-types-tmapi";

// Get the current highlight bounds.

export async function getCurrentHighlightBounds(selectedHandle: string | null, control: ControlNode): Promise<NativeBounds | null> {
    const initialBounds = control.bounds;
    if (!initialBounds) {
        notice.info("Selected control has no bounds to highlight.");
        return null;
    }
    if (isBoundsEmpty(initialBounds)) {
        if (appSettings.controls_ShowEmptyBoundsNotice) {
            triggerEmptyBoundsFlash();
        }
        return null;
    }
    if (!selectedHandle || !control.runtimeId) {
        return initialBounds;
    }

    const rectJson = await tmApi.getControlCurrentBounds(selectedHandle, control.runtimeId);
    const currentBounds = JSON.parse(rectJson) as NativeBounds | null;

    if (!currentBounds) {
        notice.info("Selected control has no current on-screen bounds.");
        return null;
    }
    if (isBoundsEmpty(currentBounds)) {
        if (appSettings.controls_ShowEmptyBoundsNotice) {
            triggerEmptyBoundsFlash();
        }
        return null;
    }

    return currentBounds;
}

function isBoundsEmpty(bounds: NativeBounds): boolean {
    return bounds.right <= bounds.left || bounds.bottom <= bounds.top;
}

// Trigger a flash of the empty bounds badge.

export const emptyBoundsFlashTokenAtom = atom(0);
export const triggerEmptyBoundsFlashAtom = atom(
    null,
    (get, set): void => {
        set(emptyBoundsFlashTokenAtom, get(emptyBoundsFlashTokenAtom) + 1);
    }
);

const defaultJotaiStore = getDefaultStore();

function triggerEmptyBoundsFlash(): void {
    defaultJotaiStore.set(triggerEmptyBoundsFlashAtom);
}

//
