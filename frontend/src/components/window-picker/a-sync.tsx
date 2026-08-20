import { useEffect } from "react";
import { useSnapshot } from "valtio/react";
import { windowPickerBus } from "./a-bridge";
import { applyWindowPickerEventJson, stopWindowPicker, windowPickerStore } from "./a-store";

/** Mount once at app root so finder events reach the Valtio store from any control. */
export function WindowPickerSync() {
    const { active, iconMode, overlayShowCursor } = useSnapshot(windowPickerStore);
    const hideCursor = active && iconMode === "overlay" && !overlayShowCursor;

    useEffect(
        () => {
            const unsubscribe = windowPickerBus.subscribe(applyWindowPickerEventJson);
            return () => {
                unsubscribe();
                void stopWindowPicker();
            };
        },
        []
    );

    if (!hideCursor) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] cursor-none"
            aria-hidden
        />
    );
}
