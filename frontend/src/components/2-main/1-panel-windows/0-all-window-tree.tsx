import { type ReactNode, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { classNames, normalizeHwnd } from "@renderer/utils";
import { ScrollArea } from "../../ui/shadcn/scroll-area";
import { IconDesktopComputerPc, IconL_AppWindow, IconL_ChevronDown, IconL_ChevronRight } from "../../ui/icons";

import { type WindowInfo } from "@renderer/store/9-types-tmapi";
import { selectedHwndAtom, windowInfosAtom } from "./state-atoms/2-1-atoms-windows-list";
import { selectWindowAtom } from "@renderer/store/2-3-atoms-highlight";
import { WindowTreeHeader } from "./1-window-tree-header";
import { FileIcon } from "../5-file-icons/0-file-icon";
import { focusTreeViewFromEvent, treeRowSelectedClasses, treeScrollViewportProps } from "../shared-ui/tree-selection";

export function WindowTreePanel() {
    const windowInfos: WindowInfo[] = useAtomValue(windowInfosAtom);
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const selectWindow = useSetAtom(selectWindowAtom);

    return (
        <div className="h-full min-h-0 bg-card border-r flex flex-col">
            <WindowTreeHeader />

            <ScrollArea
                className="group/tree flex-1 min-h-0"
                fixedWidth
                parentContentWidth
                viewportClassName="outline-none"
                viewportProps={treeScrollViewportProps}
            >
                {windowInfos.map(
                    (windowInfo, i) => (
                        <WindowNode key={i} windowInfo={windowInfo} selectedHandle={selectedHwnd} onSelect={selectWindow} depth={0} />
                    )
                )}
            </ScrollArea>
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
                onClick={(e) => {
                    focusTreeViewFromEvent(e);
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
    const iconClasses = "size-3.5 text-muted-foreground";

    let fallback: ReactNode;
    if (windowInfo.className === "Progman" && windowInfo.processName.toLowerCase() === "explorer.exe") {
        fallback = <IconDesktopComputerPc className={iconClasses} />;
    } else if (windowInfo.className === "Windows.UI.Core.CoreWindow" && windowInfo.title === "Windows Input Experience") {
        fallback = <IconL_AppWindow className="size-3.5 text-orange-500/50" />;
    } else {
        fallback = <IconL_AppWindow className={iconClasses} />;
    }

    return (
        <FileIcon
            path={windowInfo.processPath}
            className="mr-0.5"
            fallback={fallback}
        />
    );
}

function getRowClasses(isSelected: boolean): string {
    return classNames(
        "group relative px-2 py-0.5 cursor-pointer flex items-center rounded-none",
        isSelected ? treeRowSelectedClasses : "hover:bg-accent/50",
    );
}

function getWindowNodeTitle(windowInfo: WindowInfo): string {
    const hwnd = normalizeHwnd(windowInfo.handle);
    const title = windowInfo.title || "No Title";
    const processName = windowInfo.processName || "No Process Name";
    const className = windowInfo.className || "No Class Name";
    return `Process: ${processName}\nTitle: ${title}\nHWND: ${hwnd}\nClassname: ${className}`;
}
