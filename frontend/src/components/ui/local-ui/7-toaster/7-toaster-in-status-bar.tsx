import { type ReactNode } from "react";
import { clearStatusNotice, pushStatusNotice } from "@renderer/components/3-footer/status-bar";

export const notice = {
    error: (message: ReactNode) => pushStatusNotice("error", message),
    warning: (message: ReactNode) => pushStatusNotice("warning", message),
    info: (message: ReactNode) => pushStatusNotice("info", message),
    success: (message: ReactNode) => pushStatusNotice("success", message),
    dismiss: (id?: string | number) => clearStatusNotice(id),
};
