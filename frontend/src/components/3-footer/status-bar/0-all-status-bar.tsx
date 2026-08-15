import { AnimatePresence, motion } from "motion/react";
import { useSnapshot } from "valtio/react";
import { PanelBottomIcon } from "lucide-react";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "@renderer/components/ui/shadcn/button";
import { IconStopCircle, SymbolCross, SymbolInfo, SymbolWarning } from "@renderer/components/ui/icons";
import { type StatusNotice, type StatusNoticeType } from "./9-types";
import { clearStatusNotice, statusBarStore } from "./c-store-status";

export function AppStatusBar() {
    const { current } = useSnapshot(statusBarStore);

    return (
        <div className="shrink-0 h-7 text-[.65rem] bg-muted/20 border-t border-foreground/20 flex items-center">
            <div className="relative flex-1 min-w-0 h-full overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                    {current
                        ? <StatusNoticeRow key={current.id} notice={current} />
                        : <ReadyRow key="ready" />
                    }
                </AnimatePresence>
            </div>
            <ButtonToggleReport />
        </div>
    );
}

function ReadyRow() {
    return (
        <motion.div
            className="absolute inset-0 px-2 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: "easeOut" } }}
            transition={{ duration: 0.22, ease: "easeOut" }}
        >
            <span className="text-muted-foreground">Ready</span>
        </motion.div>
    );
}

function StatusNoticeRow({ notice }: { notice: StatusNotice; }) {
    return (
        <motion.div
            className="absolute inset-0 px-2 flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: "easeIn" } }}
            transition={{
                opacity: { duration: 0.2 },
                y: { type: "spring", bounce: 0.15, duration: 0.35 },
            }}
        >
            <StatusTypeIcon type={notice.type} />
            <div className="min-w-0 flex-1 truncate">
                {notice.message}
            </div>
            <Button
                className="size-5 rounded"
                variant="ghost"
                size="icon"
                type="button"
                title="Dismiss"
                onClick={() => clearStatusNotice(notice.id)}
            >
                <SymbolCross className="size-2.5" />
            </Button>
        </motion.div>
    );
}

function ButtonToggleReport() {
    const { ui_showReportPanel } = useSnapshot(appSettings);
    return (
        <Button
            className={classNames("size-5 rounded mr-1", ui_showReportPanel && "bg-accent")}
            variant="ghost"
            size="icon"
            type="button"
            title={ui_showReportPanel ? "Hide report" : "Show report"}
            onClick={() => { appSettings.ui_showReportPanel = !appSettings.ui_showReportPanel; }}
        >
            <PanelBottomIcon className="size-3" />
        </Button>
    );
}

function StatusTypeIcon({ type }: { type: StatusNoticeType; }) {
    return (
        <span className={classNames("size-4 shrink-0 grid place-items-center rounded-sm text-background", iconWrapClasses(type))}>
            {type === "success" && <SymbolInfo className="size-3" />}
            {type === "info" && <SymbolInfo className="size-3" />}
            {type === "warning" && <SymbolWarning className="size-3" />}
            {type === "error" && <IconStopCircle className="size-3 stroke-background!" />}
        </span>
    );
}

function iconWrapClasses(type: StatusNoticeType): string {
    return (
        type === "success" ? "bg-green-600"
            : type === "info" ? "bg-blue-600"
                : type === "warning" ? "bg-orange-600"
                    : type === "error" ? "bg-red-500"
                        : ""
    );
}
