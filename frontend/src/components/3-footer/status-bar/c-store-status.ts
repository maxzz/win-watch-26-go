import { type ReactNode } from "react";
import { proxy } from "valtio";
import { type StatusBarState, type StatusNoticeType } from "./9-types";

const DISMISS_MS = 2500;

export const statusBarStore = proxy<StatusBarState>({
    current: null,
});

let nextId = 1;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function clearDismissTimer(): void {
    if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
    }
}

function scheduleDismiss(id: number): void {
    clearDismissTimer();
    dismissTimer = setTimeout(
        () => {
            dismissTimer = null;
            clearStatusNotice(id);
        },
        DISMISS_MS
    );
}

function toNoticeText(message: ReactNode): string {
    if (typeof message === "string") {
        return message.replace(/<br\s*\/?>/gi, " ");
    }
    if (typeof message === "number" || typeof message === "bigint") {
        return String(message);
    }
    return "";
}

export function showStatusNotice(type: StatusNoticeType, message: string): number {
    const id = nextId++;
    statusBarStore.current = {
        id,
        type,
        message,
    };
    scheduleDismiss(id);
    return id;
}

export function pushStatusNotice(type: StatusNoticeType, message: ReactNode): number {
    return showStatusNotice(type, toNoticeText(message));
}

export function clearStatusNotice(id?: string | number): void {
    if (id == null || statusBarStore.current?.id === id) {
        clearDismissTimer();
        statusBarStore.current = null;
    }
}
