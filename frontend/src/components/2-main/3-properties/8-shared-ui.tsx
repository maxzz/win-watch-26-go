import { type PropsWithChildren, type ReactNode } from "react";
import { Copy, FolderOpen } from "lucide-react";
import { classNames } from "@renderer/utils";
import { Button } from "@renderer/components/ui/shadcn/button";
import { notice } from "@renderer/components/ui/local-ui/7-toaster";
import { type RectInfo } from "@renderer/store/3-window-detail";
import { FileIcon } from "../5-file-icons";

/** Marker label for a horizontal separator in data-driven property lists. */
export const PROP_SEP = "-";

export type PropertyEntry = {
    label: string;
    value: ReactNode;
    title?: string;
};

export function PropertyGrid({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return (
        <div className={classNames("w-full text-xs grid grid-cols-[auto_1fr]", className)}>
            {children}
        </div>
    );
}

/** Bold header spanning both columns (keeps label-column width consistent across groups). */
export function PropertyHeader({ children }: PropsWithChildren) {
    return (
        <div className="col-span-2 px-1.5 pl-2.5 py-px mt-1.5 font-semibold cursor-default select-none">
            {children}
        </div>
    );
}

/** Full-width cell for non label/value content inside a PropertyGrid. */
export function PropertyFullRow({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return (
        <div className={classNames("col-span-2", className)}>
            {children}
        </div>
    );
}

export function PropertyRow({ label, children, title }: { label: string; children: ReactNode; title?: string; }) {
    const titleText = title ?? (typeof children === "string" ? children : undefined);
    return (
        <div className="contents">
            <div className="relative px-1.5 pl-2.5 py-px cursor-default select-none" title={label}>
                {/* Vertical divider painted inside the cell so it never crosses adjacent separators. */}
                <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-foreground/20 dark:bg-foreground/20" />
                {label}
            </div>
            <div className="px-1.5 py-px break-all truncate cursor-default" title={titleText}>
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

/** Renders data-driven rows; use `{ label: PROP_SEP }` (or `"-"`) for a horizontal separator. */
export function PropertyEntries({ entries }: { entries: PropertyEntry[]; }) {
    return entries.map((prop, idx) => {
        if (prop.label === PROP_SEP || prop.label === "-") {
            return <PropertySeparator key={idx} />;
        }
        return (
            <PropertyRow key={idx} label={prop.label} title={prop.title}>
                {prop.value}
            </PropertyRow>
        );
    });
}

export function Mono({ children, className }: PropsWithChildren<{ className?: string; }>) {
    return <span className={classNames("font-mono text-[0.65rem] text-foreground/80", className)}>{children}</span>;
}

export function hex8(n: number): string {
    return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export function rectText(r: RectInfo): string {
    return `(${r.left},${r.top})-(${r.right},${r.bottom}), ${r.width}x${r.height}`;
}

export function PathWithCopy({ path }: { path: string; }) {
    if (!path) {
        return <span className="text-muted-foreground/60">N/A</span>;
    }
    return (
        <span className="min-w-0 w-full inline-flex items-center gap-1.5">
            <FileIcon path={path} className="shrink-0" />
            <span className="flex-1 min-w-0 truncate" title={path}>{path}</span>
            <span className="shrink-0 inline-flex items-center gap-0.5">
                <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="size-5 rounded shrink-0"
                    title="Open folder in File Explorer and highlight this file"
                    aria-label="Reveal in File Explorer"
                    onClick={() => {
                        void tmApi.revealInExplorer(path).catch((e) => {
                            notice.error(`Failed to reveal in File Explorer:<br/>${String(e)}`);
                        });
                    }}
                >
                    <FolderOpen className="size-3 text-muted-foreground stroke-[1.5px]" />
                </Button>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="size-5 rounded shrink-0"
                    title="Copy path"
                    aria-label="Copy path"
                    onClick={() => void navigator.clipboard.writeText(path).catch(() => undefined)}
                >
                    <Copy className="size-3 text-muted-foreground stroke-[1.5px]" />
                </Button>
            </span>
        </span>
    );
}

export function StyleList({ title, hexValue, names }: { title: string; hexValue: number; names: string[]; }) {
    return (
        <div className="mb-2 last:mb-0 px-1.5">
            <div className="mb-1 text-xs">
                <span className="text-muted-foreground">{title}</span>
                {": "}
                <Mono>{hex8(hexValue)}</Mono>
            </div>
            {names.length === 0
                ? <div className="pl-2 text-xs text-muted-foreground">(none)</div>
                : (
                    <ul className="pl-2 text-xs space-y-0.5">
                        {names.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                )}
        </div>
    );
}

export function integrityLabel(level: string): ReactNode {
    switch (level) {
        case "high": return "High";
        case "medium": return "Medium";
        case "mediumplus": return "Medium Plus";
        case "low": return "Low";
        case "na": return "N/A";
        case "undetected":
        default:
            return <span className="text-muted-foreground/60">N/A</span>;
    }
}
