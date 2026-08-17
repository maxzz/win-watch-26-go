import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { motion } from "motion/react";
import { classNames } from "@renderer/utils";
import { IconL_ChevronDown, IconL_ChevronRight, IconRefresh } from "@renderer/components/ui/icons";
import { Button } from "@renderer/components/ui/shadcn/button";

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
    
    const committedRef = useRef<{ subtitle?: ReactNode; subtitleHint?: string; children: ReactNode; } | null>(null);
    if (!loading) {
        committedRef.current = { subtitle, subtitleHint, children };
    }
    const committed = committedRef.current;

    return (
        <div>
            <div className="flex items-center gap-0.5 pr-2.5">

                <button className="flex-1 min-w-0 px-1.5 pl-2 py-1 text-left text-xs font-semibold select-none inline-flex items-center gap-1 hover:bg-muted/40" onClick={() => onOpenChange(!open)} type="button">
                    <span className="truncate" title={titleHint}>
                        {title}
                    </span>

                    {open
                        ? <IconL_ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                        : <IconL_ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    }

                    {showReading
                        ? (
                            <motion.span
                                className="ml-auto text-[0.65rem] font-normal text-muted-foreground truncate"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                reading
                            </motion.span>
                        )
                        : committed?.subtitle
                            ? (
                                <span className="ml-auto text-[0.65rem] font-normal text-muted-foreground truncate" title={committed.subtitleHint}>
                                    {committed.subtitle}
                                </span>
                            )
                            : null
                    }
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
                <div className={classNames("border-y border-foreground/20", loading && "pointer-events-none")}>
                    {committed
                        ? committed.children
                        : showReading && <AccReadingMessage>reading</AccReadingMessage>
                    }
                </div>
            )}
        </div>
    );
}

function useDelayedTrue(active: boolean, delayMs: number, resetKey?: string | null): boolean {
    const [ready, setReady] = useState(false);
    useEffect(
        () => {
            if (!active) {
                setReady(false);
                return;
            }
            setReady(false);
            const id = window.setTimeout(() => setReady(true), delayMs);
            return () => window.clearTimeout(id);
        },
        [active, delayMs, resetKey]);
    return ready && active;
}

function AccReadingMessage({ children }: { children: ReactNode; }) {
    return (
        <motion.div
            className="px-2.5 py-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}
