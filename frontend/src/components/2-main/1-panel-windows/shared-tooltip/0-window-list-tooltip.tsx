import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { asHexNumber, normalizeHwnd } from "@renderer/utils";
import { type WindowInfo } from "@renderer/store/9-types-tmapi";
import { windowInfosAtom } from "../state-atoms/2-1-atoms-windows-list";
import { windowListTooltipStore } from "./c-store-window-tooltip";

export function WindowListTooltip() {
    const { hwnd, visible, anchor } = useSnapshot(windowListTooltipStore);
    const windowInfos = useAtomValue(windowInfosAtom);
    const windowInfo = findWindowByHandle(windowInfos, hwnd);
    const tipRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

    useLayoutEffect(
        () => {
            if (!visible || !windowInfo || !tipRef.current) {
                setPos((prev) => prev.ready ? { ...prev, ready: false } : prev);
                return;
            }

            const tip = tipRef.current.getBoundingClientRect();
            const gap = 8;
            let left = anchor.left + anchor.width + gap;
            let top = anchor.top;

            if (left + tip.width > window.innerWidth - gap) {
                left = anchor.left - tip.width - gap;
            }
            if (left < gap) {
                left = gap;
            }
            if (top + tip.height > window.innerHeight - gap) {
                top = window.innerHeight - tip.height - gap;
            }
            if (top < gap) {
                top = gap;
            }

            setPos({ top, left, ready: true });
        },
        [visible, hwnd, windowInfo, anchor.top, anchor.left, anchor.width, anchor.height]
    );

    if (!visible || !windowInfo || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            ref={tipRef}
            role="tooltip"
            className="fixed z-50 pointer-events-none px-2 py-1.5 text-[.65rem] leading-snug text-popover-foreground bg-popover border border-border rounded-md shadow-md"
            style={{ top: pos.top, left: pos.left, opacity: pos.ready ? 1 : 0 }}
        >
            <WindowTooltipBody windowInfo={windowInfo} />
        </div>,
        document.body
    );
}

function WindowTooltipBody({ windowInfo }: { windowInfo: WindowInfo; }) {
    return (
        <div className="min-w-40 max-w-72 space-y-0.5">
            <div>
                <span className="font-semibold">{windowInfo.processName || "No Process Name"}</span>
                {" "}
                [PID={asHexNumber({ value: windowInfo.processId, prefix: true })}]
            </div>
            <div>
                <span className="font-semibold">class: </span>
                {windowInfo.className || "No Class Name"}
            </div>
            <div className="text-muted-foreground truncate">
                <span className="font-semibold text-popover-foreground">title: </span>
                {windowInfo.title || "No Title"}
            </div>
            <div className="text-muted-foreground">
                <span className="font-semibold text-popover-foreground">HWND: </span>
                {normalizeHwnd(windowInfo.handle)}
            </div>
        </div>
    );
}

function findWindowByHandle(windows: WindowInfo[], hwnd: string | null): WindowInfo | null {
    if (!hwnd) {
        return null;
    }
    for (const windowInfo of windows) {
        if (windowInfo.handle === hwnd) {
            return windowInfo;
        }
        if (windowInfo.children?.length) {
            const found = findWindowByHandle(windowInfo.children, hwnd);
            if (found) {
                return found;
            }
        }
    }
    return null;
}
