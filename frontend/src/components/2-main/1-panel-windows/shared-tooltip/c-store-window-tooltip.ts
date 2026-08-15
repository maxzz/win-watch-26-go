import { type MouseEvent } from "react";
import { proxy } from "valtio";
import { type WindowTooltipAnchor, type WindowListTooltipState } from "./9-types";

const SHOW_DELAY_MS = 350;
const emptyAnchor: WindowTooltipAnchor = { top: 0, left: 0, width: 0, height: 0 };

export const windowListTooltipStore = proxy<WindowListTooltipState>({
    hwnd: null,
    visible: false,
    anchor: { ...emptyAnchor },
});

let showTimer: ReturnType<typeof setTimeout> | null = null;

function clearShowTimer(): void {
    if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
    }
}

function setAnchorFromRect(rect: DOMRect): void {
    windowListTooltipStore.anchor.top = rect.top;
    windowListTooltipStore.anchor.left = rect.left;
    windowListTooltipStore.anchor.width = rect.width;
    windowListTooltipStore.anchor.height = rect.height;
}

export function hoverWindowRow(hwnd: string, rect: DOMRect): void {
    if (windowListTooltipStore.hwnd === hwnd) {
        return;
    }

    windowListTooltipStore.hwnd = hwnd;
    setAnchorFromRect(rect);

    if (windowListTooltipStore.visible) {
        return;
    }
    if (showTimer) {
        return;
    }
    showTimer = setTimeout(
        () => {
            showTimer = null;
            if (windowListTooltipStore.hwnd) {
                windowListTooltipStore.visible = true;
            }
        },
        SHOW_DELAY_MS
    );
}

export function leaveWindowList(): void {
    clearShowTimer();
    windowListTooltipStore.visible = false;
    windowListTooltipStore.hwnd = null;
    windowListTooltipStore.anchor.top = emptyAnchor.top;
    windowListTooltipStore.anchor.left = emptyAnchor.left;
    windowListTooltipStore.anchor.width = emptyAnchor.width;
    windowListTooltipStore.anchor.height = emptyAnchor.height;
}

export function onWindowListMouseOver(e: MouseEvent<HTMLElement>): void {
    const row = (e.target as HTMLElement).closest("[data-window-row]") as HTMLElement | null;
    if (!row || !e.currentTarget.contains(row)) {
        leaveWindowList();
        return;
    }
    const hwnd = row.dataset.hwnd;
    if (!hwnd) {
        leaveWindowList();
        return;
    }
    hoverWindowRow(hwnd, row.getBoundingClientRect());
}

export function onWindowListMouseLeave(): void {
    leaveWindowList();
}

export function onWindowListScroll(): void {
    leaveWindowList();
}
