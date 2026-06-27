import { type ReactNode, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { classNames } from "@renderer/utils/classnames";
import { ChevronRight, ChevronDown, MousePointerClick } from "lucide-react";
import { getControlTypeName } from "@renderer/utils/uia/0-uia-control-type-names";
import { getControlTypeIcon } from "@renderer/utils/uia/1-uia-control-type-icons-svg";
import { type ControlNode } from "@renderer/store/9-types-tmapi";
import { selectedHwndAtom } from "@renderer/store/2-1-atoms-windows-list";
import { refreshWindowControlsTreeAtom, selectedControlAtom, windowControlsTreeAtom, windowControlsTreeErrorAtom, windowControlsTreeHwndAtom, windowControlsTreeLoadingAtom, windowControlsTreeRefreshingAtom } from "@renderer/store/2-2-1-atoms-controls-list";
import { setSelectedControlAtom } from "@renderer/store/2-3-atoms-highlight";
import { doInvokeControlAtom } from "@renderer/store/2-5-atoms-invoke";
import { ControlTreeHeader } from "./headers/6-control-tree-header";

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
        [selectedHwnd, refreshTree]
    );

    useEffect(
        () => {
            // Clear previous selection immediately when switching windows,
            // so the properties panel doesn't show stale data.
            void setSelectedControl(null);
        },
        [selectedHwnd, setSelectedControl]
    );

    useEffect(
        () => {
            if (!windowControlsTree) return;
            // When a new controls tree is obtained, select the first control in the tree.
            void setSelectedControl(windowControlsTree);
        },
        [windowControlsTree, setSelectedControl]
    );

    return (
        <div className="h-full bg-card flex flex-col">
            <ControlTreeHeader />
            {hasTreeForSelectedWindow && windowControlsTree
                ? (<>
                    <ControlTree windowControlsTree={windowControlsTree} refreshing={refreshing} error={error} />
                </>)
                : <ControlTreeStatus hwnd={selectedHwnd} loading={loading || refreshing} error={error} hasTree={false} />
            }
        </div >
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
        <div className="relative flex-1">
            <ControlTreeInlineStatus refreshing={refreshing} error={error} />
            <div className="group/controltree h-full overflow-auto" tabIndex={0}>
                <ControlTreeNode node={windowControlsTree} depth={0} />
            </div>
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
        <div
            className={getRowClasses(isSelected)}
            style={{ paddingLeft: `${depth * 15 + 4}px` }}
            onClick={() => setSelectedControl(node)}
        >
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
    return classNames("group relative px-2 h-5 cursor-pointer select-none flex items-center", isSelected ? rowSelected : "hover:bg-accent/50");
}

const rowSelected = "\
bg-muted-foreground/20 \
border-primary \
\
outline -outline-offset-1 \
outline-primary dark:outline-primary/50 \
\
group-focus/controltree:bg-blue-100 dark:group-focus/controltree:bg-blue-900 \
group-focus/controltree:outline-blue-500 dark:group-focus/controltree:outline-blue-500 \
\
before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] \
\
before:bg-primary dark:before:bg-primary/70 \
group-focus/controltree:before:bg-blue-500 group-focus/controltree:dark:before:bg-blue-500 \
";

//TODO: when "Folow focus" but the new window not in the list then refresh the tree for the new window.
//TODO: ControlTreeStatus should be an overlay on the control tree, not a separate component.
//TODO: Add control tree count to the footer.