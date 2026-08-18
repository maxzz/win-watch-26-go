import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@renderer/components/ui/shadcn/dialog";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Switch } from "@renderer/components/ui/shadcn/switch";

import { ControlTheme, WindowLifecycleOptions } from "@renderer/components/window-lifecycle";
import { setExcludeOwnAppWindowsAtom, setSortWindowsByProcessNameAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setExcludeOwnAppWindows = useSetAtom(setExcludeOwnAppWindowsAtom);
    const setSortWindowsByProcessName = useSetAtom(setSortWindowsByProcessNameAtom);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0! max-w-90! gap-0!">

                <DialogHeader className="px-4 py-3 text-left border-b gap-0">
                    <DialogTitle>
                        Options
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        App behavior preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 py-4 text-xs font-normal flex flex-col gap-1.5">

                    <div className="text-xs font-semibold border-b border-border pb-1">Window</div>
                    <WindowLifecycleOptions />
                    <ControlTheme />

                    {/* <div className="mt-1.5 text-xs font-semibold border-b border-border pb-1">Windows list</div>
                    <OptionCheckbox
                        checked={settings.winlist_ExcludeUs}
                        onCheckedChange={(checked) => void setExcludeOwnAppWindows(checked)}
                        label="Exclude windows of our application"
                        title="Hide this app's top-level windows from the list and prefer the next window in z-order"
                    />
                    <OptionCheckbox
                        checked={settings.winlist_SortWindows}
                        onCheckedChange={(checked) => void setSortWindowsByProcessName(checked)}
                        label="Sort windows list by process name"
                        title="Sort acquired windows alphabetically by process name"
                    /> */}

                </div>

                <DialogFooter className="m-0 px-4 pb-3 pt-2 flex justify-center!">
                    <Button type="button" variant="outline" className="min-w-16 font-condensed font-normal" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OptionCheckbox({ checked, onCheckedChange, label, disabled, title }: { checked: boolean, onCheckedChange: (checked: boolean) => void, label: React.ReactNode, disabled?: boolean; title?: string; }) {
    return (
        <Label
            className={classNames("h-5 text-xs font-normal flex items-center justify-between gap-x-1", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            <Switch className={classNames("scale-90", disabled && "disabled:opacity-100")} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </Label>
    );
}
