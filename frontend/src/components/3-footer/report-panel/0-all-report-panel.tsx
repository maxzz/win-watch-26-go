import { useEffect, useLayoutEffect, useRef } from "react";
import { useSnapshot } from "valtio/react";
import { Button } from "@renderer/components/ui/shadcn/button";
import { ScrollArea2 } from "@renderer/components/ui/shadcn/scroll-area";
import { IconTrash24 } from "@renderer/components/ui/icons";
import { ReportRow } from "./1-report-row";
import { ReportDetailTooltip } from "./2-report-detail-tooltip";
import { clearReportMessages, reportStore } from "./c-store-report";
import { leaveReportInfoIcon } from "./c-store-report-tooltip";

const NEAR_BOTTOM_PX = 48;

export function AppReportPanel() {
    const { entries } = useSnapshot(reportStore);
    const viewportRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);
    const hasEntries = entries.length > 0;

    useEffect(
        () => {
            const el = viewportRef.current;
            if (!el) {
                return;
            }
            const onScroll = () => {
                stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
                leaveReportInfoIcon();
            };
            el.addEventListener("scroll", onScroll, { passive: true });
            return () => el.removeEventListener("scroll", onScroll);
        },
        [hasEntries]);

    useLayoutEffect(
        () => {
            const el = viewportRef.current;
            if (!el || !stickToBottomRef.current) {
                return;
            }
            el.scrollTop = el.scrollHeight;
        }
    );

    return (
        <div className="relative size-full min-h-0 bg-card flex flex-col">
            <div className="shrink-0 px-2 pr-1 h-7 bg-muted/20 border-b flex justify-between items-center select-none">
                <span className="text-xs font-semibold">
                    Report
                </span>
                <Button
                    onClick={clearReportMessages}
                    title="Clear messages"
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={!hasEntries}
                >
                    <IconTrash24 className="size-3.5" />
                </Button>
            </div>

            <ScrollArea2 ref={viewportRef} className="flex-1 min-h-0">
                {!hasEntries
                    ? (
                        <div className="p-3 text-xs text-muted-foreground">
                            No messages
                        </div>
                    )
                    : (
                        <div className="p-2 space-y-1.5">
                            {entries.map(
                                (entry) => (
                                    <ReportRow key={entry.id} entry={entry} />
                                )
                            )}
                        </div>
                    )}
            </ScrollArea2>
            <ReportDetailTooltip />
        </div>
    );
}
