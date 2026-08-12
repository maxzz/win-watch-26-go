import type { ComponentPropsWithoutRef, MouseEvent } from "react";

/**
 * Selection look for window / control tree rows:
 * - unfocused panel: gray fill + muted left accent
 * - focused panel (`group/tree` + focus-within): blue fill, outline, blue left accent
 *
 * Uses outline (not ring), matching traytools intent while keeping this app's left bar.
 */
export const treeRowSelectedClasses = "\
text-tree-select-foreground bg-tree-select \
\
group-focus-within/tree:bg-tree-select-focused \
group-focus-within/tree:text-tree-select-focused-foreground \
group-focus-within/tree:outline \
group-focus-within/tree:outline-1 \
group-focus-within/tree:-outline-offset-1 \
group-focus-within/tree:outline-tree-select-border \
group-focus-within/tree:font-normal \
group-focus-within/tree:before:bg-tree-select-border \
before:absolute \
before:left-0 \
before:top-0 \
before:bottom-0 \
before:w-[3px] \
before:bg-muted-foreground/40 \
";

export const treeScrollViewportProps = {
    tabIndex: 0,
    "data-slot": "tree-view",
} satisfies ComponentPropsWithoutRef<"div"> & { "data-slot"?: string; };

/** Focus the tree scroll viewport so selection uses the focused (blue) style. */
export function focusTreeViewFromEvent(e: MouseEvent<HTMLElement>): void {
    (e.currentTarget.closest("[data-slot=tree-view]") as HTMLElement | null)?.focus();
}
