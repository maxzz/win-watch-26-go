import { proxy } from "valtio";
import { type WindowDetailInfo } from "./9-types-window-info";

interface WindowDetailState {
    handle: string | null;
    info: WindowDetailInfo | null;
    loading: boolean;
    error: string | null;
}

/** Fetched Win32 detail for the selected control's native HWND. */
export const windowDetailStore = proxy<WindowDetailState>({
    handle: null,
    info: null,
    loading: false,
    error: null,
});

/** Drops stale responses when the user selects another control quickly. */
let selectionRequestId = 0;

export function clearWindowDetailInfo(): void {
    selectionRequestId += 1;
    windowDetailStore.handle = null;
    windowDetailStore.info = null;
    windowDetailStore.loading = false;
    windowDetailStore.error = null;
}

export async function loadWindowDetailInfo(handle: string | null | undefined): Promise<void> {
    const requestId = ++selectionRequestId;

    if (!handle) {
        windowDetailStore.handle = null;
        windowDetailStore.info = null;
        windowDetailStore.loading = false;
        windowDetailStore.error = null;
        return;
    }

    windowDetailStore.handle = handle;
    windowDetailStore.loading = true;
    windowDetailStore.error = null;

    try {
        const json = await tmApi.getWindowDetailInfo(handle);
        if (requestId !== selectionRequestId) {
            return;
        }
        const info = JSON.parse(json) as WindowDetailInfo;
        windowDetailStore.info = info;
    } catch (e) {
        if (requestId !== selectionRequestId) {
            return;
        }
        windowDetailStore.info = null;
        windowDetailStore.error = String(e);
    } finally {
        if (requestId === selectionRequestId) {
            windowDetailStore.loading = false;
        }
    }
}
