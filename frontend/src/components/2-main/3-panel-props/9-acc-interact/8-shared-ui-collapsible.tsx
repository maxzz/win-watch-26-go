import { type PropsWithChildren, type ReactNode } from "react";
import { classNames } from "@renderer/utils";
import { IconL_ChevronDown, IconL_ChevronRight, IconRefresh } from "@renderer/components/ui/icons";
import { Button } from "@renderer/components/ui/shadcn/button";
import { AccReadingMessage, useDelayedTrue } from "./8-shared-ui-reading";

export function AccCollapsible({ open, onOpenChange, title, titleHint, subtitle, subtitleHint, loading, loadingKey, onRefresh, refreshDisabled, refreshTitle, children }: PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    titleHint?: string;
    subtitle?: ReactNode;
    subtitleHint?: string;
    loading?: boolean;
    loadingKey?: string | null;
    onRefresh?: () => void;
    refreshDisabled?: boolean;
    refreshTitle?: string;
}>) {
    const showReading = useDelayedTrue(!!loading, 2000, loadingKey);
    return (
        <div className="border-t border-foreground/20">
            <div className="flex items-center gap-0.5 pr-1">

                <button className="flex-1 min-w-0 px-1.5 pl-2 py-1 text-left text-xs font-semibold select-none inline-flex items-center gap-1 hover:bg-muted/40" onClick={() => onOpenChange(!open)} type="button">
                    <span className="truncate" title={titleHint}>
                        {title}
                    </span>

                    {open
                        ? <IconL_ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                        : <IconL_ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    }

                    {!loading && subtitle && (
                        <span className="ml-auto text-[0.65rem] font-normal text-muted-foreground truncate" title={subtitleHint}>
                            {subtitle}
                        </span>
                    )}
                </button>

                {onRefresh && (
                    <Button
                        className="shrink-0"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => { e.stopPropagation(); void onRefresh?.(); }}
                        disabled={refreshDisabled}
                        title={refreshTitle ?? "Get current state"}
                        type="button"
                    >
                        <IconRefresh className="size-2.5" />
                    </Button>
                )}
            </div>

            {open && (
                <div className={classNames("pb-1.5")}>
                    {showReading
                        ? <AccReadingMessage>reading</AccReadingMessage>
                        : !loading && children
                    }
                </div>
            )}
        </div>
    );
}
