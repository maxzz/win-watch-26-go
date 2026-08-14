import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { AnimatePresence, motion } from "motion/react";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Switch } from "@renderer/components/ui/shadcn/switch";
import { IconRefresh } from "@renderer/components/ui/icons";

import { selectedHwndAtom } from "../1-panel-windows/state-atoms/2-1-atoms-windows-list";
import { refreshWindowControlsTreeAtom } from "@renderer/components/2-main/2-panel-controls/state-atoms/2-2-1-atoms-controls-list";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-3-atoms-highlight";
import { emptyBoundsFlashTokenAtom } from "@renderer/store/2-4-atoms-bounds";
import { TreeOptionsPopover } from "./1-1-tree-options-popover";

export function ControlTreeHeader() {
    return (
        <div className="shrink-0 px-2 py-1 pr-0 h-7 border-b bg-muted/20 flex items-center justify-between select-none">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold">
                    Controls
                </span>

                <div className="self-stretch relative w-px">
                    <div className="absolute left-0 top-0 pt-px w-max h-full">
                        <EmptyBoundsFlashBadge />
                        {/* <div className="px-2 pb-0.5 text-[0.6rem] text-white bg-red-500 rounded">empty bounds</div> */}
                    </div>
                </div>
            </div>

            {/* <motion.div className="px-2 text-[0.6rem] text-white bg-red-500 rounded">
                empty bounds
            </motion.div> */}

            <div className="flex items-center gap-0 pr-1.75">
                <ControlTreeAutoHighlightToggle />
                <TreeOptionsPopover />
                <Button_RefreshControlsTree />
            </div>
        </div>
    );
}

function ControlTreeAutoHighlightToggle() {
    const { controls_AutoHighlight: autoHighlightSelectedControl } = useSnapshot(appSettings);
    const setAutoHighlightSelectedControl = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <Label className="text-[0.65rem] font-normal text-muted-foreground cursor-pointer gap-0" title="Auto highlight the selected control">
            <span className="pb-px">Auto-highlight:</span>
            <Switch
                className="-ml-0.5 scale-60"
                checked={autoHighlightSelectedControl}
                onCheckedChange={(checked) => setAutoHighlightSelectedControl(checked)}
            />
        </Label>
    );
}

function Button_RefreshControlsTree() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const refreshControlsTree = useSetAtom(refreshWindowControlsTreeAtom);

    return (
        <Button
            variant="ghost"
            size="xs"
            onClick={() => void refreshControlsTree({ force: true })}
            title="Refresh controls tree"
            disabled={!selectedHwnd}
        >
            <IconRefresh className="size-2.5" />
        </Button>
    );
}

function EmptyBoundsFlashBadge() {
    const flashToken = useAtomValue(emptyBoundsFlashTokenAtom);
    const [activeToken, setActiveToken] = useState<number | null>(null);

    useEffect(
        () => {
            if (flashToken <= 0) {
                return;
            }
            setActiveToken(flashToken);
            const timeout = setTimeout(
                () => {
                    setActiveToken((current) => current === flashToken ? null : current);
                },
                1600
            );
            return () => clearTimeout(timeout);
        },
        [flashToken]);

    return (
        <AnimatePresence initial={false}>
            {activeToken !== null && (
                <motion.div
                    className="px-2 text-[0.6rem] text-white bg-red-500 rounded"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1.06, 1.0, 0.98] }}
                    transition={{ duration: 1.55, times: [0, 0.2, 0.45, 1], ease: "easeOut" }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                    key={activeToken}
                >
                    empty bounds
                </motion.div>
            )}
        </AnimatePresence>
    );
}
