import { useEffect } from "react";
import { windowPickerBus } from "./a-bridge";
import { applyWindowPickerEventJson, stopWindowPicker } from "./a-store";

/** Mount once at app root so finder events reach the Valtio store from any control. */
export function WindowPickerSync() {
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
    return null;
}
