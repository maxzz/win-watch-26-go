import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { appSettings } from "@renderer/store/8-ui-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";
import { setAutoHighlightSelectedControlAtom, setHighlightBlinkCountAtom, setHighlightBorderColorAtom, setHighlightBorderWidthAtom, setShowEmptyBoundsNotificationAtom } from "@renderer/store/2-3-atoms-highlight";
import { setExcludeOwnAppWindowsAtom, setSortWindowsByProcessNameAtom } from "@renderer/store/2-1-atoms-windows-list";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setAutoHighlight = useSetAtom(setAutoHighlightSelectedControlAtom);
    const setHighlightBlinkCount = useSetAtom(setHighlightBlinkCountAtom);
    const setHighlightBorderWidth = useSetAtom(setHighlightBorderWidthAtom);
    const setHighlightBorderColor = useSetAtom(setHighlightBorderColorAtom);
    const setShowEmptyBoundsNotification = useSetAtom(setShowEmptyBoundsNotificationAtom);
    const setExcludeOwnAppWindows = useSetAtom(setExcludeOwnAppWindowsAtom);
    const setSortWindowsByProcessName = useSetAtom(setSortWindowsByProcessNameAtom);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[360px]!">

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

                    <div className="mt-1.5 text-xs font-semibold border-b border-border pb-1">Controls list</div>
                    <OptionCheckbox
                        checked={settings.controls_AutoHighlight}
                        onCheckedChange={(checked) => setAutoHighlight(checked)}
                        label="Auto highlight selected control bounds"
                        title="Auto highlight the selected control"
                    />
                    <OptionNumber
                        value={settings.controls_highlightBlinks}
                        onValueChange={setHighlightBlinkCount}
                        label="Highlight blink count"
                        title="Blink count used for control/window highlight (count, min: 1, max: 10)"
                        min={1}
                        max={10}
                    />
                    <OptionNumber
                        value={settings.controls_highlightBorderWidth}
                        onValueChange={setHighlightBorderWidth}
                        label="Highlight border width"
                        title="Border width used for control/window highlight (pixels, min: 1, max: 20)"
                        min={1}
                        max={20}
                    />
                    <OptionColor
                        value={settings.controls_highlightBorderColor}
                        onValueChange={setHighlightBorderColor}
                        label="Highlight border color"
                        title="Border color used for control/window highlight"
                    />
                    <OptionCheckbox
                        checked={settings.controls_ShowEmptyBoundsNotice}
                        onCheckedChange={(checked) => setShowEmptyBoundsNotification(checked)}
                        label="Show empty bounds notification"
                        title="Show a notification when selected control bounds are empty"
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

function OptionNumber({ value, onValueChange, label, disabled, title, min, max }: { value: number; onValueChange: (value: number) => void; label: React.ReactNode; disabled?: boolean; title?: string; min: number; max: number; }) {
    return (
        <Label
            className={classNames("text-xs font-normal flex items-center justify-between gap-x-2", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            <input
                className="px-2 h-6 w-16 rounded border border-input bg-background text-right text-xs"
                type="number"
                value={value}
                min={min}
                max={max}
                step={1}
                disabled={disabled}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    onValueChange(next);
                }}
            />
        </Label>
    );
}

function OptionColor({ value, onValueChange, label, disabled, title }: { value: string; onValueChange: (value: string) => void; label: React.ReactNode; disabled?: boolean; title?: string; }) {
    return (
        <Label
            className={classNames("text-xs font-normal flex items-center justify-between space-x-2", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            {/* <div className="overflow-hidden"> */}
            <input
                className="-mx-0.5 -my-1 h-8 w-[68px] rounded-xl"
                type="color"
                value={value}
                disabled={disabled}
                onChange={(e) => onValueChange(e.target.value)}
            />
            {/* </div> */}
        </Label>
    );
}
