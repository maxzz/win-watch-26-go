import { type ComponentProps } from "react";
import { useAtom, useSetAtom, type WritableAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { type ThemeMode } from "@renderer/utils/theme-apply";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Checkbox } from "@renderer/components/ui/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@renderer/components/ui/shadcn/dialog";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/shadcn/select";
import { Switch } from "@renderer/components/ui/shadcn/switch";
import {
    settingsQuitOnCloseAtom,
    settingsRunElevatedAtom,
    settingsShowInTaskbarAtom,
    settingsShowThemeToggleAtom,
    settingsStayOnTopAtom,
} from "@renderer/components/window-lifecycle";
import { setExcludeOwnAppWindowsAtom, setSortWindowsByProcessNameAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    // const setExcludeOwnAppWindows = useSetAtom(setExcludeOwnAppWindowsAtom);
    // const setSortWindowsByProcessName = useSetAtom(setSortWindowsByProcessNameAtom);

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

                    <div className="text-xs font-semibold border-b border-border pb-1">
                        Window
                    </div>

                    <ControlCheckbox label="Quit the application when the window close button is clicked" valueAtom={settingsQuitOnCloseAtom} />
                    <ControlCheckbox
                        label="Show application icon on the taskbar"
                        title="When off, the window stays open but has no taskbar button; use the tray icon to show or hide it"
                        valueAtom={settingsShowInTaskbarAtom}
                    />
                    <ControlCheckbox label="Run this application elevated" valueAtom={settingsRunElevatedAtom} />
                    <ControlCheckbox label="Make the window stay on top of all others" valueAtom={settingsStayOnTopAtom} />
                    <ControlTheme className="mt-1.5" />

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

function ControlTheme({ className, ...rest }: ComponentProps<"div">) {
    const { ui_theme: theme } = useSnapshot(appSettings);
    const [showThemeToggle, setShowThemeToggle] = useAtom(settingsShowThemeToggleAtom);

    return (
        <div className={classNames("flex items-center gap-2", className)} {...rest}>
            <Label className="font-normal" htmlFor="settings-theme">
                Theme
            </Label>

            <Select value={theme} onValueChange={(value) => { appSettings.ui_theme = value as ThemeMode; }}>
                <SelectTrigger className="h-6!" id="settings-theme">
                    <SelectValue placeholder="Select theme" />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem className="font-condensed font-normal" value="light">Light</SelectItem>
                    <SelectItem className="font-condensed font-normal" value="dark">Dark</SelectItem>
                    <SelectItem className="font-condensed font-normal" value="system">System</SelectItem>
                </SelectContent>
            </Select>

            <Label
                className="font-normal flex items-center gap-1.5 cursor-pointer"
                htmlFor="settings-show-theme-toggle"
                title="Show the theme toggle button in the application header"
            >
                <Checkbox
                    id="settings-show-theme-toggle"
                    checked={showThemeToggle}
                    onCheckedChange={(v) => setShowThemeToggle(v === true)}
                />
                Show theme toggle button in header
            </Label>
        </div>
    );
}

function ControlCheckbox({ label, valueAtom, className, ...rest }: ComponentProps<typeof Label> & { label: string; valueAtom: WritableAtom<boolean, [boolean], void | Promise<void>>; }) {
    const [checked, setChecked] = useAtom(valueAtom);

    return (
        <Label className={classNames("font-normal flex items-center gap-1.5 cursor-pointer", className)} {...rest}>
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
            {label}
        </Label>
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
