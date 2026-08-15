import { classNames } from "@renderer/utils";
import { IconStopCircle, SymbolInfo, SymbolWarning } from "@renderer/components/ui/icons";
import { type ReportEntry, type ReportLevel } from "./9-types";

export function formatReportTime(at: number): string {
    return new Date(at).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function ReportRow({ entry }: { entry: ReportEntry; }) {
    const detail = entry.detail || fieldSummary(entry);
    return (
        <div className="text-xs grid grid-cols-[auto_auto_minmax(0,auto)_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold tabular-nums text-muted-foreground">
                {formatReportTime(entry.at)}
            </span>

            <ReportLevelStatus level={entry.level} />

            <span className="truncate" title={entry.title}>
                {entry.source && (
                    <span className="mr-1.5 text-muted-foreground/70">
                        {entry.source}
                    </span>
                )}
                {entry.title}
            </span>

            <span className="text-muted-foreground truncate" title={detailTitle(entry)}>
                {detail}
            </span>

            {entry.fields?.length
                ? (
                    <div className="col-span-4 pl-[4.5rem] text-[0.65rem] text-muted-foreground/80 space-y-0.5">
                        {entry.fields.map(
                            (field) => (
                                <div key={field.name} className="truncate" title={`${field.name}: ${field.value}`}>
                                    <span className="font-medium text-foreground/70">{field.name}: </span>
                                    {field.value}
                                </div>
                            )
                        )}
                    </div>
                )
                : null}
        </div>
    );
}

function ReportLevelStatus({ level }: { level: ReportLevel; }) {
    return (
        <span className={classNames("min-w-16 inline-flex items-center gap-1 justify-end", levelToneClass[level])}>
            {level}
            {level === "success" && <SymbolInfo className="size-3" />}
            {level === "info" && <SymbolInfo className="size-3" />}
            {level === "warning" && <SymbolWarning className="size-3" />}
            {level === "error" && <IconStopCircle className="size-3" />}
        </span>
    );
}

function fieldSummary(entry: ReportEntry): string {
    if (!entry.fields?.length) {
        return "";
    }
    return entry.fields.map((field) => `${field.name}: ${field.value}`).join(" · ");
}

function detailTitle(entry: ReportEntry): string {
    const lines = [entry.title];
    if (entry.detail) {
        lines.push(entry.detail);
    }
    if (entry.source) {
        lines.push(`Source: ${entry.source}`);
    }
    for (const field of entry.fields ?? []) {
        lines.push(`${field.name}: ${field.value}`);
    }
    return lines.join("\n");
}

const levelToneClass: Record<ReportLevel, string> = {
    success: "text-emerald-600 dark:text-emerald-400",
    info: "text-sky-600 dark:text-sky-400",
    warning: "text-orange-500/75 dark:text-yellow-400/50",
    error: "text-destructive",
};
