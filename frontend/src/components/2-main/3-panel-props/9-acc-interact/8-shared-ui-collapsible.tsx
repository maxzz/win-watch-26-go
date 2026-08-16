import { type PropsWithChildren, type ReactNode } from "react";
import { classNames } from "@renderer/utils";
import { IconL_ChevronDown, IconL_ChevronRight, IconRefresh } from "@renderer/components/ui/icons";
import { Button } from "@renderer/components/ui/shadcn/button";

export function AccCollapsible({ open, onOpenChange, title, subtitle, onRefresh, refreshDisabled, refreshTitle, children }: PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: ReactNode;
    onRefresh?: () => void;
    refreshDisabled?: boolean;
    refreshTitle?: string;
}>) {
    return (
        <div className="border-t border-foreground/20">
            <div className="flex items-center gap-0.5 pr-1">
                <button
                    type="button"
                    className="flex-1 min-w-0 px-1.5 pl-2 py-1 text-left text-xs font-semibold select-none inline-flex items-center gap-1 hover:bg-muted/40"
                    onClick={() => onOpenChange(!open)}
                >
                    {open
                        ? <IconL_ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                        : <IconL_ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{title}</span>
                    {subtitle
                        ? <span className="ml-1 font-normal text-muted-foreground truncate">{subtitle}</span>
                        : null}
                </button>
                {onRefresh
                    ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="shrink-0"
                            disabled={refreshDisabled}
                            title={refreshTitle ?? "Get current state"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onRefresh();
                            }}
                        >
                            <IconRefresh className="size-2.5" />
                        </Button>
                    )
                    : null}
            </div>
            {open
                ? <div className={classNames("pb-1.5")}>{children}</div>
                : null}
        </div>
    );
}
