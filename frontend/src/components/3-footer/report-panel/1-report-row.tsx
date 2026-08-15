import { type MouseEvent } from "react";
import { classNames } from "@renderer/utils";
import { IconStopCircle, SymbolInfo, SymbolWarning } from "@renderer/components/ui/icons";
import { type ReportEntry, type ReportLevel } from "./9-types";
import { hoverReportInfoIcon, leaveReportInfoIcon } from "./c-store-report-tooltip";

export function formatReportTime(at: number): string {
    return new Date(at).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function ReportRow({ entry }: { entry: ReportEntry; }) {
    return (
        <div className="text-xs flex items-center gap-2 min-w-0">
            <span className="font-semibold tabular-nums text-muted-foreground shrink-0">
                {formatReportTime(entry.at)}
            </span>

            <ReportLevelStatus entry={entry} />

            <span className="truncate min-w-0">
                {entry.title}
            </span>
        </div>
    );
}

function ReportLevelStatus({ entry }: { entry: ReportEntry; }) {
    const hasDetails = !!(entry.detail || entry.fields?.length);
    return (
        <span className={classNames("min-w-16 shrink-0 inline-flex items-center gap-1 justify-end", levelToneClass[entry.level])}>
            {entry.level}
            <span
                className={hasDetails ? "cursor-default" : undefined}
                onMouseEnter={hasDetails ? (e) => onInfoEnter(e, entry.id) : undefined}
                onMouseLeave={hasDetails ? leaveReportInfoIcon : undefined}
            >
                {entry.level === "success" && <SymbolInfo className="size-3" />}
                {entry.level === "info" && <SymbolInfo className="size-3" />}
                {entry.level === "warning" && <SymbolWarning className="size-3" />}
                {entry.level === "error" && <IconStopCircle className="size-3" />}
            </span>
        </span>
    );
}

function onInfoEnter(e: MouseEvent<HTMLElement>, entryId: number): void {
    hoverReportInfoIcon(entryId, e.currentTarget.getBoundingClientRect());
}

const levelToneClass: Record<ReportLevel, string> = {
    success: "text-emerald-600 dark:text-emerald-400",
    info: "text-sky-600 dark:text-sky-400",
    warning: "text-orange-500/75 dark:text-yellow-400/50",
    error: "text-destructive",
};
