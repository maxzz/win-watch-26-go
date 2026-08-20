import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Crosshair } from "lucide-react";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Switch } from "@renderer/components/ui/shadcn/switch";
import { IconRefresh, Symbol_uia_Toolbar, Symbol_uia_Tooltip, Symbol_uia_Tooltip2 } from "@renderer/components/ui/icons";

import { doRefreshWindowInfosAtom, ensureWindowInListAtom, selectedHwndAtom } from "./state-atoms/2-1-atoms-windows-list";
import { doHighlightSelectedWindowAtom, selectWindowAtom } from "@renderer/store/2-3-atoms-highlight";
import { WindowsTreeOptionsPopover } from "./1-1-tree-options-popover";
import { WindowPickerControl, type WindowPickerEvent } from "@renderer/components/window-picker";

export function WindowTreeHeader() {
    return (
        <div className="shrink-0 px-2 pr-0 h-7 bg-muted/20 border-b flex justify-between items-center select-none">
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">
                    Top Windows
                </span>
                <WindowPickerInHeader />
            </div>

            <div className="flex items-center gap-0 pr-1.75">
                <Button_FollowFocus />
                <WindowsTreeOptionsPopover />
                <Button_RefreshTree />
                {/* <Button_HighlightHwnd /> */}

                {/* <Symbol_uia_Toolbar className="size-3.5" />
                <Symbol_uia_Tooltip className="size-3.5" />
                <Symbol_uia_Tooltip2 className="size-3.5" /> */}
            </div>
        </div>
    );
}

function WindowPickerInHeader() {
    const selectWindow = useSetAtom(selectWindowAtom);
    const refreshWindowInfos = useSetAtom(doRefreshWindowInfosAtom);
    const ensureWindowInList = useSetAtom(ensureWindowInListAtom);

    const onReleased = useCallback(
        (result: WindowPickerEvent) => {
            void applyPickedWindow(result, { selectWindow, refreshWindowInfos, ensureWindowInList });
        },
        [selectWindow, refreshWindowInfos, ensureWindowInList]
    );

    return (
        <WindowPickerControl onReleased={onReleased} />
    );
}

async function applyPickedWindow(
    result: WindowPickerEvent,
    actions: {
        selectWindow: (handle: string) => void | Promise<void>;
        refreshWindowInfos: () => void | Promise<void>;
        ensureWindowInList: (window: { handle: string; title?: string; processName?: string; }) => void;
    },
): Promise<void> {
    const handle = result.rootHandle || result.handle;
    if (!handle) {
        return;
    }
    actions.ensureWindowInList({
        handle,
        title: result.title,
        processName: result.processName,
    });
    await actions.selectWindow(handle);
    await actions.refreshWindowInfos();
    await actions.selectWindow(handle);
}

function Button_FollowFocus() {
    const settings = useSnapshot(appSettings);
    const enabled = settings.winlist_ActiveWinMonEnabled;
    return (
        <Label className="text-[0.65rem] font-normal text-muted-foreground cursor-pointer gap-0" title={enabled ? "Stop following the focused window" : "Follow the focused window"}>
            <span className="pb-px">Follow focus:</span>
            <Switch
                className="-ml-0.5 scale-60"
                checked={enabled}
                onCheckedChange={(checked) => appSettings.winlist_ActiveWinMonEnabled = checked}
            />
        </Label>
    );
}

function Button_RefreshTree() {
    const refreshWindowInfos = useSetAtom(doRefreshWindowInfosAtom);
    return (
        <Button
            variant="ghost"
            size="xs"
            onClick={refreshWindowInfos}
            title="Refresh window list (refresh window tree)"
        >
            <IconRefresh className="size-2.5" />
        </Button>
    );
}

function Button_HighlightHwnd() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const doHighlightSelectedWindow = useSetAtom(doHighlightSelectedWindowAtom);
    return (
        <Button
            className="disabled:opacity-10"
            variant="ghost"
            size="xs"
            onClick={doHighlightSelectedWindow}
            disabled={!selectedHwnd}
            title="Highlight selected window"
        >
            <Crosshair className="size-3.5 stroke-[1.5px]" />
        </Button>
    );
}
