import { type ComponentProps } from "react";
import { useAtom, type WritableAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { type ThemeMode } from "@renderer/utils/theme-apply";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Checkbox } from "@renderer/components/ui/shadcn/checkbox";
import { Label } from "@renderer/components/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/shadcn/select";
import { Switch } from "@renderer/components/ui/shadcn/switch";
import {
    settingsQuitOnCloseAtom,
    settingsRunElevatedAtom,
    settingsShowInTaskbarAtom,
    settingsShowThemeToggleAtom,
    settingsStayOnTopAtom,
} from "./a-atoms";

export function WindowLifecycleOptions() {
    return (
        <div className="text-xs font-normal flex flex-col gap-1.5">
            <ControlCheckbox label="Run WinWatch elevated" valueAtom={settingsRunElevatedAtom} />
            <ControlCheckbox label="Make the window stay on top of all others" valueAtom={settingsStayOnTopAtom} />
            <ControlCheckbox
                label="Show application icon on the taskbar"
                title="When off, the window stays open but has no taskbar button; use the tray icon to show or hide it"
                valueAtom={settingsShowInTaskbarAtom}
            />
            <ControlCheckbox label="Quit the application when the window close button is clicked" valueAtom={settingsQuitOnCloseAtom} />
        </div>
    );
}

export function ControlTheme({ className, ...rest }: ComponentProps<"div">) {
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

/** Kept for future options that need a switch instead of a checkbox. */
export function ControlSwitch({ label, valueAtom, className, ...rest }: ComponentProps<typeof Label> & { label: string; valueAtom: WritableAtom<boolean, [boolean], void | Promise<void>>; }) {
    const [checked, setChecked] = useAtom(valueAtom);

    return (
        <Label className={classNames("-ml-2 font-normal flex items-center gap-0", className)} {...rest}>
            <Switch className="scale-50" checked={checked} onCheckedChange={setChecked} />
            {label}
        </Label>
    );
}
