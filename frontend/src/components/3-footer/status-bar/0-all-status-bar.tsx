import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";
import { Button } from "@renderer/components/ui/shadcn/button";
import { IconStopCircle, SymbolCross, SymbolInfo, SymbolWarning } from "@renderer/components/ui/icons";
import { type StatusNoticeType } from "./9-types";
import { clearStatusNotice, statusBarStore } from "./c-store-status";

export function AppStatusBar() {
    const { current } = useSnapshot(statusBarStore);

    return (
        <div className="shrink-0 h-7 px-2 text-[.65rem] bg-muted/20 border-t border-foreground/20 flex items-center gap-2">
            {current
                ? (
                    <>
                        <StatusTypeIcon type={current.type} />
                        <div className="min-w-0 flex-1 truncate">
                            {current.message}
                        </div>
                        <Button
                            className="size-5 rounded"
                            variant="ghost"
                            size="icon"
                            type="button"
                            title="Dismiss"
                            onClick={() => clearStatusNotice(current.id)}
                        >
                            <SymbolCross className="size-2.5" />
                        </Button>
                    </>
                )
                : (
                    <span className="text-muted-foreground">Ready</span>
                )}
        </div>
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
