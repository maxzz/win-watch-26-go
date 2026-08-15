import { useRef } from "react";
import { useSnapshot } from "valtio/react";
import { GripVerticalIcon } from "lucide-react";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { AppReportPanel } from "./0-all-report-panel";

const MIN_HEIGHT = 96;
const MAX_HEIGHT_RATIO = 0.7;
const DEFAULT_HEIGHT = 220;

export function ReportPanelDock() {
    const { ui_showReportPanel, ui_reportPanelHeight } = useSnapshot(appSettings);

    if (!ui_showReportPanel) {
        return null;
    }

    const height = clampReportHeight(ui_reportPanelHeight ?? DEFAULT_HEIGHT);

    return (
        <div className="shrink-0 min-h-0 flex flex-col" style={{ height }}>
            <ReportResizeHandle />
            <div className="flex-1 min-h-0 overflow-hidden">
                <AppReportPanel />
            </div>
        </div>
    );
}

function ReportResizeHandle() {
    const dragRef = useRef<{ startY: number; startHeight: number; } | null>(null);

    return (
        <div
            role="separator"
            aria-orientation="horizontal"
            className={handleLineClasses}
            onPointerDown={
                (e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    dragRef.current = {
                        startY: e.clientY,
                        startHeight: appSettings.ui_reportPanelHeight ?? DEFAULT_HEIGHT,
                    };
                }
            }
            onPointerMove={
                (e) => {
                    const drag = dragRef.current;
                    if (!drag) {
                        return;
                    }
                    const next = drag.startHeight + (drag.startY - e.clientY);
                    appSettings.ui_reportPanelHeight = clampReportHeight(next);
                }
            }
            onPointerUp={() => { dragRef.current = null; }}
            onPointerCancel={() => { dragRef.current = null; }}
        >
            <div className={handleGripClasses}>
                <GripVerticalIcon className="size-2.5 rotate-90" />
            </div>
        </div>
    );
}

function clampReportHeight(height: number): number {
    const max = Math.max(MIN_HEIGHT, Math.round(window.innerHeight * MAX_HEIGHT_RATIO));
    return Math.min(max, Math.max(MIN_HEIGHT, Math.round(height)));
}

const handleGripClasses = "w-3 h-4 bg-border border rounded-xs opacity-0 transition-opacity delay-200 duration-300 group-hover:opacity-100 flex items-center justify-center z-50";

const handleLineClasses = "\
group shrink-0 relative w-full h-0.5 \
bg-foreground/20 \
hover:bg-sky-500 \
transition-all \
cursor-row-resize \
flex items-center justify-center \
\
after:absolute after:left-0 after:right-0 after:h-1 after:top-1/2 after:-translate-y-1/2 \
";
