import { proxy } from "valtio";
import { showStatusNotice } from "../status-bar/c-store-status";
import { type ReportEntry, type ReportField, type ReportFieldInput, type ReportLevel, type ReportLogOptions, type ReportStoreState } from "./9-types";

const MAX_ENTRIES = 500;

export const reportStore = proxy<ReportStoreState>({
    entries: [],
});

let nextId = 1;

function normalizeFields(fields?: ReportFieldInput): ReportField[] | undefined {
    if (!fields) {
        return undefined;
    }
    if (Array.isArray(fields)) {
        return fields.map((field) => ({ name: field.name, value: field.value }));
    }
    const rows = Object.entries(fields)
        .filter(([, value]) => value != null && value !== "")
        .map(([name, value]) => ({ name, value: String(value) }));
    return rows.length ? rows : undefined;
}

export function appendReportEntry(level: ReportLevel, title: string, options?: ReportLogOptions): number {
    const id = nextId++;
    const entry: ReportEntry = {
        id,
        at: options?.at ?? Date.now(),
        level,
        title,
        detail: options?.detail,
        source: options?.source,
        fields: normalizeFields(options?.fields),
    };
    reportStore.entries.push(entry);
    if (reportStore.entries.length > MAX_ENTRIES) {
        reportStore.entries.splice(0, reportStore.entries.length - MAX_ENTRIES);
    }
    return id;
}

/** Append to the report log and show the latest line in the status bar. */
export function logReport(level: ReportLevel, title: string, options?: ReportLogOptions): number {
    const id = appendReportEntry(level, title, options);
    showStatusNotice(level, title);
    return id;
}

export function clearReportMessages(): void {
    reportStore.entries = [];
}

export const report = {
    error: (title: string, options?: ReportLogOptions) => logReport("error", title, options),
    warning: (title: string, options?: ReportLogOptions) => logReport("warning", title, options),
    info: (title: string, options?: ReportLogOptions) => logReport("info", title, options),
    success: (title: string, options?: ReportLogOptions) => logReport("success", title, options),
    log: logReport,
    clear: clearReportMessages,
};
