import { proxy } from "valtio";
import targetUrl from "@renderer/assets/icons/artboard-52-8.png";
import { windowPickerBus } from "./a-bridge";
import { emptyWindowPickerState, type WindowPickerEvent, type WindowPickerReleasedHandler, type WindowPickerState } from "./9-types";

/** Live finder session. High-frequency cursor updates mutate this proxy. */
export const windowPickerStore = proxy<WindowPickerState>({ ...emptyWindowPickerState });

const releasedListeners = new Set<WindowPickerReleasedHandler>();

export function subscribeWindowPickerReleased(handler: WindowPickerReleasedHandler): () => void {
    releasedListeners.add(handler);
    return () => {
        releasedListeners.delete(handler);
    };
}

function applyDomCursor(active: boolean): void {
    if (active) {
        document.documentElement.style.cursor = `url("${targetUrl}") 32 32, crosshair`;
        return;
    }
    document.documentElement.style.cursor = "";
}

export function resetWindowPickerStore(): void {
    windowPickerStore.active = false;
    windowPickerStore.released = false;
    windowPickerStore.processName = "";
    windowPickerStore.screen.x = 0;
    windowPickerStore.screen.y = 0;
    windowPickerStore.client.x = 0;
    windowPickerStore.client.y = 0;
    windowPickerStore.handle = "";
    windowPickerStore.rootHandle = "";
    windowPickerStore.title = "";
    applyDomCursor(false);
}

export function applyWindowPickerEvent(payload: WindowPickerEvent): void {
    const released = payload.released === true;
    windowPickerStore.active = !released;
    windowPickerStore.released = released;
    windowPickerStore.processName = payload.processName ?? "";
    windowPickerStore.screen.x = payload.screen?.x ?? 0;
    windowPickerStore.screen.y = payload.screen?.y ?? 0;
    windowPickerStore.client.x = payload.client?.x ?? 0;
    windowPickerStore.client.y = payload.client?.y ?? 0;
    windowPickerStore.handle = payload.handle ?? "";
    windowPickerStore.rootHandle = payload.rootHandle ?? "";
    windowPickerStore.title = payload.title ?? "";
    applyDomCursor(!released);

    if (released) {
        releasedListeners.forEach((handler) => handler(payload));
    }
}

export function applyWindowPickerEventJson(json: string): void {
    try {
        applyWindowPickerEvent(JSON.parse(json) as WindowPickerEvent);
    } catch (e) {
        console.error("Failed to parse window-picker event", e);
    }
}

/** Press-and-hold start. Icon hides immediately; Go (or the browser stub) tracks the mouse. */
export async function startWindowPicker(): Promise<boolean> {
    if (windowPickerStore.active) {
        return true;
    }
    windowPickerStore.active = true;
    windowPickerStore.released = false;
    windowPickerStore.processName = "";
    applyDomCursor(true);

    const ok = await windowPickerBus.start();
    if (!ok) {
        resetWindowPickerStore();
    }
    return ok;
}

export async function stopWindowPicker(): Promise<void> {
    await windowPickerBus.stop();
    if (windowPickerStore.active) {
        resetWindowPickerStore();
    }
}
