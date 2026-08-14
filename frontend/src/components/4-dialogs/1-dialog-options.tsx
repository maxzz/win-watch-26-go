import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@renderer/components/ui/shadcn/dialog";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Switch } from "@renderer/components/ui/shadcn/switch";

import { setExcludeOwnAppWindowsAtom, setSortWindowsByProcessNameAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setExcludeOwnAppWindows = useSetAtom(setExcludeOwnAppWindowsAtom);
    const setSortWindowsByProcessName = useSetAtom(setSortWindowsByProcessNameAtom);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-90!">

                <DialogHeader>
                    <DialogTitle>
                        Options
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        App behavior preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="pb-4 grid gap-1">
                    <div className="mt-1.5 text-xs font-semibold border-b border-border pb-1">Windows list</div>

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
                    />
                </div>
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
