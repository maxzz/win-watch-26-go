import { type ReactNode } from "react";
import { proxy } from "valtio";
import { type StatusBarState, type StatusNoticeType } from "./9-types";

export const statusBarStore = proxy<StatusBarState>({
    current: null,
});

let nextId = 1;

function toNoticeText(message: ReactNode): string {
    if (typeof message === "string") {
        return message.replace(/<br\s*\/?>/gi, " ");
    }
    if (typeof message === "number" || typeof message === "bigint") {
        return String(message);
    }
    return "";
}

export function pushStatusNotice(type: StatusNoticeType, message: ReactNode): number {
    const id = nextId++;
    statusBarStore.current = {
        id,
        type,
        message: toNoticeText(message),
    };
    return id;
}

export function clearStatusNotice(id?: string | number): void {
    if (id == null || statusBarStore.current?.id === id) {
        statusBarStore.current = null;
    }
}
