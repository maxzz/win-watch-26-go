import { type PropsWithChildren, type ReactNode } from "react";
import { classNames } from "@renderer/utils";
import { Copy, FolderOpen } from "lucide-react";
import { Button } from "@renderer/components/ui/shadcn/button";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster-in-status-bar";

import { type RectInfo } from "./state-atoms/9-types-window-info";
import { FileIcon } from "../5-file-icons/0-file-icon";

export function PropertyGrid({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return (
        <div className={classNames("w-full text-xs grid grid-cols-[auto_1fr]", className)}>
            {children}
        </div>
    );
}

export function PropertyRow({ label, children, title, interactive }: { label: string; children: ReactNode; title?: string; interactive?: boolean; }) {
    const titleText = title ?? (typeof children === "string" ? children : undefined);
    return (
        <div className="contents">
            {/* Label */}
            <div className="relative px-1.5 pl-2.5 py-px text-[0.75rem] cursor-default select-none flex items-center" title={label}>
                {/* Vertical divider painted inside the cell so it never crosses adjacent separators. */}
                <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-foreground/20 dark:bg-foreground/20" />
                {label}
            </div>

            {/* Value */}
            <div className={interactive ? "pl-1.5 pr-2.5 py-px min-w-0" : "px-1.5 pr-2.5 py-px break-all truncate cursor-default"} title={interactive ? undefined : titleText}>
                {children}
            </div>
        </div>
    );
}

/**
 * Full-width horizontal rule (edge to edge of the grid).
 *
 * Painted as a border on a zero-height track (not an `h-px` row). Under Windows
 * display scaling, 1px grid rows round to 1 or 2 device pixels depending on Y
 * position — which made some separators look bold and others thin.
 */
export function PropertySeparator() {
    return (
        <div aria-hidden className="col-span-2 relative h-0">
            <div className="absolute inset-x-0 top-0 border-t border-foreground/20" />
        </div>
    );
}

//---------------------------------------------------------------------------
// "General" and "Window Extra"

/** Used for "General" and "Window Extra". Bold header spanning both columns (keeps label-column width consistent across groups). */
export function PropertyHeader({ children }: PropsWithChildren) {
    return (
        <div className="col-span-2 px-1.5 pl-2.5 py-px mt-1.5 font-semibold cursor-default select-none">
            {children}
        </div>
    );
}

/** Used for "General" and "Window Extra". Mono-spaced text. */
export function Mono({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return <span className={classNames("font-mono text-[0.65rem] text-foreground/80", className)}>{children}</span>;
}

/** Used for "General" and "Window Extra". Converts a number to a 8-digit hexadecimal string. */
export function hex8(n: number): string {
    return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** Used for "General". Converts a rectangle to a text string. */
export function rectText(r: RectInfo): string {
    return `(${r.left},${r.top})-(${r.right},${r.bottom}), ${r.width}x${r.height}`;
}

/** Used for "General". Displays a file path with a copy button. */
export function PathWithCopy({ path }: { path: string; }) {
    if (!path) {
        return <span className="text-muted-foreground/60">N/A</span>;
    }

    return (
        <span className="min-w-0 w-full inline-flex items-center gap-1.5">
            <FileIcon path={path} className="shrink-0" />

            <span className="flex-1 min-w-0 truncate" title={path}>
                {path}
            </span>

            <span className="shrink-0 inline-flex items-center gap-0.5">
                <Button
                    className="size-5 rounded shrink-0"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => { void tmApi.revealInExplorer(path).catch((e) => { notice.error(`Failed to reveal in File Explorer:<br/>${String(e)}`); }); }}
                    aria-label="Reveal in File Explorer"
                    title="Open folder in File Explorer and highlight this file"
                    type="button"
                >
                    <FolderOpen className="size-3 text-muted-foreground stroke-[1.5px]" />
                </Button>

                <Button
                    className="size-5 rounded shrink-0"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(path).catch(() => undefined)}
                    aria-label="Copy path"
                    title="Copy path"
                    type="button"
                >
                    <Copy className="size-3 text-muted-foreground stroke-[1.5px]" />
                </Button>
            </span>
        </span>
    );
}

/** Used for "Window Extra". Full-width cell for non label/value content inside a PropertyGrid. */
export function PropertyFullRow({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return (
        <div className={classNames("col-span-2", className)}>
            {children}
        </div>
    );
}

export type PropertyEntry = {
    label: string;
    value: ReactNode;
    title?: string;
};

/** Renders data-driven rows; use `{ label: PROP_SEP }` (or `"-"`) for a horizontal separator. */
function PropertyEntries({ entries }: { entries: PropertyEntry[]; }) {
    return entries.map(
        (prop, idx) => {
            if (prop.label === PROP_SEP || prop.label === "-") {
                return <PropertySeparator key={idx} />;
            }
            return (
                <PropertyRow key={idx} label={prop.label} title={prop.title}>
                    {prop.value}
                </PropertyRow>
            );
        }
    );
}

/** Used for 2-1-tab-accessibility.tsx. Marker label for a horizontal separator in data-driven property lists. */
export const PROP_SEP = "-";
