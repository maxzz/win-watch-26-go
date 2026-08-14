import { type ReactNode, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { classNames } from "@renderer/utils/classnames";
import { ChevronRight, ChevronDown, MousePointerClick } from "lucide-react";
import { ScrollArea } from "@renderer/components/ui/shadcn/scroll-area";
import { getControlTypeName } from "@renderer/utils/uia/0-uia-control-type-names";
import { getControlTypeIcon } from "@renderer/utils/uia/1-uia-control-type-icons-svg";

import { type ControlNode } from "@renderer/store/9-types-tmapi";
import { selectedHwndAtom } from "../1-panel-windows/state-atoms/2-1-atoms-windows-list";
import {
    refreshWindowControlsTreeAtom, selectedControlAtom, windowControlsTreeAtom, windowControlsTreeErrorAtom,
    windowControlsTreeHwndAtom, windowControlsTreeLoadingAtom, windowControlsTreeRefreshingAtom
} from "@renderer/components/2-main/2-panel-controls/state-atoms/2-2-1-atoms-controls-list";
import { setSelectedControlAtom } from "@renderer/store/2-3-atoms-highlight";
import { doInvokeControlAtom } from "@renderer/store/2-5-atoms-invoke";
import { ControlTreeHeader } from "./1-0-control-tree-header";
import { focusTreeViewFromEvent, treeRowSelectedClasses, treeScrollViewportProps } from "../shared-ui/tree-selection";

export function ControlTreeLoader() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const windowControlsTree = useAtomValue(windowControlsTreeAtom);
    const windowControlsTreeHwnd = useAtomValue(windowControlsTreeHwndAtom);
    const loading = useAtomValue(windowControlsTreeLoadingAtom);
    const refreshing = useAtomValue(windowControlsTreeRefreshingAtom);
    const error = useAtomValue(windowControlsTreeErrorAtom);
    const setSelectedControl = useSetAtom(setSelectedControlAtom);
    const refreshTree = useSetAtom(refreshWindowControlsTreeAtom);
    const hasTreeForSelectedWindow = !!windowControlsTree && windowControlsTreeHwnd === selectedHwnd;

    useEffect(
        () => {
            // Fetch the new controls tree when window selection changes.
            void refreshTree();
        },
        [selectedHwnd, refreshTree]);

    useEffect(
        () => {
            // Clear previous selection immediately when switching windows,
            // so the properties panel doesn't show stale data.
            void setSelectedControl(null);
        },
        [selectedHwnd, setSelectedControl]);

    useEffect(
        () => {
            if (!windowControlsTree) return;
            // When a new controls tree is obtained, select the first control in the tree.
            void setSelectedControl(windowControlsTree);
        },
        [windowControlsTree, setSelectedControl]);

    return (
        <div className="h-full min-h-0 bg-card flex flex-col">
            <ControlTreeHeader />
            {hasTreeForSelectedWindow && windowControlsTree
                ? (
                    <ControlTree windowControlsTree={windowControlsTree} refreshing={refreshing} error={error} />
                )
                : (
                    <ScrollArea className="flex-1 min-h-0" fixedWidth parentContentWidth>
                        <ControlTreeStatus hwnd={selectedHwnd} loading={loading || refreshing} error={error} hasTree={false} />
                    </ScrollArea>
                )}
        </div>
    );
}

function ControlTreeStatus({ hwnd, loading, error, hasTree }: { hwnd: string | null; loading: boolean; error: string | null; hasTree: boolean; }) {
    if (!hwnd) {
        return (
            <div className="px-2 py-1 text-xs text-muted-foreground">
                No control tree available
            </div>
        );
    }
    if (loading) {
        return (
            <div className="px-2 py-1 text-xs text-muted-foreground">
                Loading controls...
            </div>
        );
    }
    if (error) {
        return (
            <div className="px-2 py-1 text-xs text-muted-foreground">
                Failed to load controls
            </div>
        );
    }
    if (!hasTree) {
        return (
            <div className="px-2 py-1 text-xs text-muted-foreground">
                No control tree available
            </div>
        );
    }
    return null;
}

function ControlTreeInlineStatus({ refreshing, error }: { refreshing: boolean; error: string | null; }) {
    if (refreshing) {
        return (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 py-1 text-xs text-muted-foreground border-b bg-muted/80 backdrop-blur-[1px]">
                Refreshing controls...
            </div>
        );
    }
    if (error) {
        return (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 py-1 text-xs text-amber-600 border-b bg-amber-500/20 backdrop-blur-[1px]">
                Refresh failed. Showing last successful snapshot.
            </div>
        );
    }
    return null;
}

function ControlTree({ windowControlsTree, refreshing, error }: { windowControlsTree: ControlNode; refreshing: boolean; error: string | null; }) {
    return (
        <div className="relative flex-1 min-h-0">
            <ControlTreeInlineStatus refreshing={refreshing} error={error} />

            <ScrollArea className="group/tree size-full" fixedWidth parentContentWidth viewportClassName="outline-none" viewportProps={treeScrollViewportProps}>
                <ControlTreeNode node={windowControlsTree} depth={0} />
            </ScrollArea>
        </div>
    );
}

function ControlTreeNode({ node, depth }: { node: ControlNode; depth: number; }) {

    const selectedControl = useAtomValue(selectedControlAtom);
    const setSelectedControl = useSetAtom(setSelectedControlAtom);
    const invokeControl = useSetAtom(doInvokeControlAtom);

    const [expanded, setExpanded] = useAtom(node.expandedAtom);

    const isSelected = selectedControl === node; // simple reference check, might need ID check
    const hasChildren = node.children && node.children.length > 0;

    const controlIcon = getControlTypeIcon(node.controlType);

    return (<>
        <div className={getRowClasses(isSelected)} style={{ paddingLeft: `${depth * 15 + 4}px` }} onClick={(e) => { focusTreeViewFromEvent(e); setSelectedControl(node); }}>
            <span className="shrink-0 mr-1 size-4 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {hasChildren && (
                    expanded
                        ? <ChevronDown className="size-3.5" />
                        : <ChevronRight className="size-3.5" />
                )}
            </span>

            {controlIcon}

            <span className="ml-1 text-xs truncate" title={node.name}>
                <NodeText node={node} />
            </span>

            {isSelected && (
                <button className="ml-auto p-1 hover:bg-background rounded" onClick={(e) => { e.stopPropagation(); invokeControl(node); }} title="Invoke">
                    <MousePointerClick className="size-3" />
                </button>
            )}
        </div>

        {expanded && hasChildren && (
            <div>
                {node.children!.map(
                    (child, i) => (
                        <ControlTreeNode node={child} depth={depth + 1} key={i} />
                    )
                )}
            </div>
        )}
    </>);
}

function NodeText({ node }: { node: ControlNode; }): ReactNode {
    const typeName = getControlTypeName(node.controlType);
    if (typeName === "Pane") {
        return <>{
            node.className
                ? node.className
                : typeName
        }</>;
    }
    if (typeName === "Group") {
        return (<>
            {
                node.name
                    ? `${typeName}: "${node.name}"`
                    : node.className
                        ? `${typeName}: ${node.className}`
                        : typeName
            }
        </>);
    }
    // if (typeName === "Text") {
    //     return node.name ? `Text: "${node.name}"` : typeName;
    // }
    return (<>
        {typeName}
        {node.name
            ? (
                <> <span className="px-1 text-[0.6rem] text-foreground/70 dark:text-foreground/50 bg-muted-foreground/5 dark:bg-foreground/5 rounded">{node.name}</span></>
            )
            : null
        }
    </>);
}

function getRowClasses(isSelected: boolean): string {
    return classNames(
        "group relative px-2 h-5 cursor-pointer select-none flex items-center rounded-none",
        isSelected ? treeRowSelectedClasses : "hover:bg-accent/50",
    );
}

//TODO: when "Folow focus" but the new window not in the list then refresh the tree for the new window.
//TODO: ControlTreeStatus should be an overlay on the control tree, not a separate component.
//TODO: Add control tree count to the footer.
