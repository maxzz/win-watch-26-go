export type ReportLevel = "error" | "warning" | "info" | "success";

export type ReportField = {
    name: string;
    value: string;
};

export type ReportEntry = {
    id: number;
    at: number;
    level: ReportLevel;
    title: string;
    detail?: string;
    source?: string;
    fields?: readonly ReportField[];
};

export type ReportFieldInput = readonly ReportField[] | Record<string, string | number | boolean | null | undefined>;

export type ReportLogOptions = {
    detail?: string;
    source?: string;
    fields?: ReportFieldInput;
    at?: number;
};

export type ReportStoreState = {
    entries: ReportEntry[];
};
