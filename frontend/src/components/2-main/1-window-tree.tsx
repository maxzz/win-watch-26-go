import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { classNames, normalizeHwnd } from "@renderer/utils";
import { type WindowInfo } from "@renderer/store/9-types-tmapi";
import { WindowTreeHeader } from "./headers/5-window-tree-header";
import { IconDesktopComputerPc, IconL_AppWindow, IconL_ChevronDown, IconL_ChevronRight, IconL_Layout } from "../ui/icons";
import { selectedHwndAtom, windowInfosAtom } from "@renderer/store/2-1-atoms-windows-list";

export function WindowTreePanel() {
    const windowInfos: WindowInfo[] = useAtomValue(windowInfosAtom);
    const [selectedHwnd, setSelectedHwnd] = useAtom(selectedHwndAtom);

    return (
        <div className="h-full bg-card border-r flex flex-col">
            <WindowTreeHeader />

            <div className="group/windowtree flex-1 overflow-auto" tabIndex={0}>
                {windowInfos.map(
                    (windowInfo, i) => (
                        <WindowNode key={i} windowInfo={windowInfo} selectedHandle={selectedHwnd} onSelect={setSelectedHwnd} depth={0} />
                    )
                )}
            </div>
        </div>
    );
}

function WindowNode({ windowInfo, selectedHandle, onSelect, depth }: { windowInfo: WindowInfo; selectedHandle: string | null; onSelect: (h: string) => void; depth: number; }) {
    const [expanded, setExpanded] = useState(false);
    const isSelected = windowInfo.handle === selectedHandle;
    const hasChildren = windowInfo.children && windowInfo.children.length > 0;

    return (
        <div>
            <div
                className={getRowClasses(isSelected)}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => {
                    onSelect(windowInfo.handle);
                }}
                title={getWindowNodeTitle(windowInfo)}
            >
                <span
                    className="shrink-0 mr-1 size-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded
                        ? <IconL_ChevronDown className="size-3.5" />
                        : <IconL_ChevronRight className="size-3.5" />
                    )}
                </span>

                <WindowNodeIcon windowInfo={windowInfo} />

                <span className="text-xs truncate">
                    {/* <span className="ml-1 text-xs text-muted-foreground">
                        {window.handle}
                    </span> */}
                    {windowInfo.title || `[${windowInfo.processName}]`}
                </span>
            </div>

            {expanded && hasChildren && (
                <div>
                    {windowInfo.children!.map(
                        (child, i) => (
                            <WindowNode key={i} windowInfo={child} selectedHandle={selectedHandle} onSelect={onSelect} depth={depth + 1} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

function WindowNodeIcon({ windowInfo }: { windowInfo: WindowInfo; }) {
    const iconClasses = "shrink-0 mr-0.5 size-3.5 text-muted-foreground";
    
    if (windowInfo.className === "Progman" && windowInfo.processName.toLowerCase() === "explorer.exe") {
        return <IconDesktopComputerPc className={iconClasses} />;
    }

    if (windowInfo.className === "Windows.UI.Core.CoreWindow" && windowInfo.title === "Windows Input Experience") {
        const iconClasses2 = "shrink-0 mr-0.5 size-3.5 text-orange-500/50";
        return <IconL_AppWindow className={iconClasses2} />;
    }
    
    return <IconL_AppWindow className={iconClasses} />;
}

function getRowClasses(isSelected: boolean): string {
    return classNames("group relative px-2 py-0.5 cursor-pointer flex items-center", isSelected ? rowSelected : "hover:bg-accent/50");
}

const rowSelected = "\
bg-muted-foreground/20 \
border-primary \
\
outline -outline-offset-1 \
outline-primary dark:outline-primary/50 \
\
group-focus/windowtree:bg-blue-100 dark:group-focus/windowtree:bg-blue-900 \
group-focus/windowtree:outline-blue-500 dark:group-focus/windowtree:outline-blue-500 \
\
before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] \
\
before:bg-primary dark:before:bg-primary/70 \
group-focus/windowtree:before:bg-blue-500 group-focus/windowtree:dark:before:bg-blue-500 \
";

function getWindowNodeTitle(windowInfo: WindowInfo): string {
    const hwnd = normalizeHwnd(windowInfo.handle);
    const title = windowInfo.title || "No Title";
    const processName = windowInfo.processName || "No Process Name";
    const className = windowInfo.className || "No Class Name";
    return `Process: ${processName}\nTitle: ${title}\nHWND: ${hwnd}\nClassname: ${className}`;
}
