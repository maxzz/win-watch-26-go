import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSnapshot } from "valtio/react";
import { type ReportEntry } from "./9-types";
import { reportStore } from "./c-store-report";
import { reportTooltipStore } from "./c-store-report-tooltip";

export function ReportDetailTooltip() {
    const { entryId, visible, top, left, width, height } = useSnapshot(reportTooltipStore);
    const { entries } = useSnapshot(reportStore);
    const entry = entries.find((item) => item.id === entryId) ?? null;
    const tipRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

    useLayoutEffect(
        () => {
            if (!visible || !entry || !tipRef.current) {
                setPos((prev) => prev.ready ? { ...prev, ready: false } : prev);
                return;
            }
            const tip = tipRef.current.getBoundingClientRect();
            const gap = 8;
            let nextLeft = left + width + gap;
            let nextTop = top;
            if (nextLeft + tip.width > window.innerWidth - gap) {
                nextLeft = left - tip.width - gap;
            }
            if (nextLeft < gap) {
                nextLeft = gap;
            }
            if (nextTop + tip.height > window.innerHeight - gap) {
                nextTop = window.innerHeight - tip.height - gap;
            }
            if (nextTop < gap) {
                nextTop = gap;
            }
            setPos({ top: nextTop, left: nextLeft, ready: true });
        },
        [visible, entryId, entry, top, left, width, height]
    );

    if (!visible || !entry || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            ref={tipRef}
            role="tooltip"
            className="fixed z-50 pointer-events-none px-2 py-1.5 text-[.65rem] leading-snug text-popover-foreground bg-popover border border-border rounded-md shadow-md"
            style={{ top: pos.top, left: pos.left, opacity: pos.ready ? 1 : 0 }}
        >
            <ReportTooltipBody entry={entry} />
        </div>,
        document.body
    );
}

function ReportTooltipBody({ entry }: { entry: ReportEntry; }) {
    return (
        <div className="min-w-40 max-w-72 space-y-0.5">
            {entry.detail
                ? <div className="font-medium">{entry.detail}</div>
                : null}
            {entry.fields?.map(
                (field) => (
                    <div key={field.name}>
                        <span className="font-semibold">{field.name}: </span>
                        <span className="text-muted-foreground">{field.value}</span>
                    </div>
                )
            )}
        </div>
    );
}
