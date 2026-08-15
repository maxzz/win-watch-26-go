import { type ReactNode } from "react";
import { report } from "@renderer/components/3-footer/report-panel";
import { clearStatusNotice } from "@renderer/components/3-footer/status-bar";

function asText(message: ReactNode): string {
    if (typeof message === "string") {
        return message.replace(/<br\s*\/?>/gi, " ");
    }
    if (typeof message === "number" || typeof message === "bigint") {
        return String(message);
    }
    return "";
}

export const notice = {
    error: (message: ReactNode) => report.error(asText(message)),
    warning: (message: ReactNode) => report.warning(asText(message)),
    info: (message: ReactNode) => report.info(asText(message)),
    success: (message: ReactNode) => report.success(asText(message)),
    dismiss: (id?: string | number) => clearStatusNotice(id),
};
