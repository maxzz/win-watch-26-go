import { type PropsWithChildren, type ReactNode } from "react";
import { Copy, FolderOpen } from "lucide-react";
import { classNames } from "@renderer/utils";
import { Button } from "@renderer/components/ui/shadcn/button";
import { notice } from "@renderer/components/ui/local-ui/7-toaster";
import { type RectInfo } from "@renderer/store/3-window-detail";

export function Section({ title, children, grid = true }: PropsWithChildren<{ title: string; grid?: boolean; }>) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold">{title}</div>
            {grid ? <Grid>{children}</Grid> : children}
        </div>
    );
}

export function Grid({ children }: PropsWithChildren) {
    return (
        <div className="text-xs grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 items-center">
            {children}
        </div>
    );
}

export function Row({ label, children }: { label: string; children: ReactNode; }) {
    const title = typeof children === "string" ? children : undefined;
    return (
        <>
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="min-w-0 truncate" title={title}>{children}</span>
        </>
    );
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
        <div className="mb-2 last:mb-0">
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
