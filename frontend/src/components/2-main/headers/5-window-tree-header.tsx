import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/8-ui-settings";
import { Crosshair } from "lucide-react";
import { Button } from "../../ui/shadcn/button";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";
import { IconRefresh, Symbol_uia_Toolbar, Symbol_uia_Tooltip, Symbol_uia_Tooltip2 } from "../../ui/icons";
import { doRefreshWindowInfosAtom, selectedHwndAtom } from "@renderer/store/2-1-atoms-windows-list";
import { doHighlightSelectedWindowAtom } from "@renderer/store/2-3-atoms-highlight";

export function WindowTreeHeader() {
    return (
        <div className="px-2 pr-0 h-7 bg-muted/20 border-b flex justify-between items-center select-none">
            <span className="text-xs font-semibold">
                Windows
            </span>
            <div className="flex items-center gap-0">
                <Button_FollowFocus />
                <Button_RefreshTree />
                {/* <Button_HighlightHwnd /> */}

                {/* <Symbol_uia_Toolbar className="size-3.5" />
                <Symbol_uia_Tooltip className="size-3.5" />
                <Symbol_uia_Tooltip2 className="size-3.5" /> */}
            </div>
        </div>
    );
}

function Button_FollowFocus() {
    const settings = useSnapshot(appSettings);
    const enabled = settings.winlist_ActiveWinMonEnabled;
    return (
        <Label className="text-xs font-normal text-muted-foreground cursor-pointer gap-0" title={enabled ? "Stop following the focused window" : "Follow the focused window"}>
            <span className="pb-0.5">Follow focus:</span>
            <Switch
                className="scale-75"
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
            <IconRefresh className="size-3" />
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
