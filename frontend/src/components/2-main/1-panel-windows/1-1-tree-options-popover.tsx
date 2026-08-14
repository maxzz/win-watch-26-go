import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { Settings } from "lucide-react";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Checkbox } from "@renderer/components/ui/shadcn/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@renderer/components/ui/shadcn/popover";
import { setExcludeOwnAppWindowsAtom, setSortWindowsByProcessNameAtom, windowInfosAtom } from "./state-atoms/2-1-atoms-windows-list";

export function WindowsTreeOptionsPopover() {
    const windowInfos = useAtomValue(windowInfosAtom);
    const settings = useSnapshot(appSettings);
    const setExcludeOwnAppWindows = useSetAtom(setExcludeOwnAppWindowsAtom);
    const setSortWindowsByProcessName = useSetAtom(setSortWindowsByProcessNameAtom);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="xs" title="Tree options" type="button">
                    <Settings className="size-3 stroke-1!" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-auto min-w-56">
                <div className="mx-auto text-xs font-semibold select-none">
                    Tree options
                </div>

                <Separator />

                <div className="py-1 flex flex-col gap-2">
                    <label
                        className="text-xs select-none flex items-center gap-1.5 cursor-pointer"
                        title="Hide this app's top-level windows from the list and prefer the next window in z-order"
                    >
                        <Checkbox
                            checked={settings.winlist_ExcludeUs}
                            onCheckedChange={(v) => void setExcludeOwnAppWindows(v === true)}
                        />
                        Exclude windows of our application
                    </label>

                    <label
                        className="text-xs select-none flex items-center gap-1.5 cursor-pointer"
                        title="Sort acquired windows alphabetically by process name"
                    >
                        <Checkbox
                            checked={settings.winlist_SortWindows}
                            onCheckedChange={(v) => void setSortWindowsByProcessName(v === true)}
                        />
                        Sort windows list by process name
                    </label>
                </div>

                <Separator />

                <div className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 cursor-default">
                    <span title="Total number of top-level windows">Total windows</span>
                    <span className="tabular-nums text-[11px]">{windowInfos.length}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function Separator() {
    return <div className="-mx-2 h-px border-t border-border" />;
}
