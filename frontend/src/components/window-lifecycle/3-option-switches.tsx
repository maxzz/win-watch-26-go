import { type ComponentProps } from "react";
import { useAtom, type WritableAtom } from "jotai";
import { classNames } from "@renderer/utils";
import { Checkbox } from "@renderer/components/ui/shadcn/checkbox";
import { Label } from "@renderer/components/ui/shadcn/label";
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
            <ControlSwitch label="Run WinWatch elevated" valueAtom={settingsRunElevatedAtom} />
            <ControlSwitch label="Make the window stay on top of all others" valueAtom={settingsStayOnTopAtom} />
            <ControlSwitch
                label="Show application icon on the taskbar"
                title="When off, the window stays open but has no taskbar button; use the tray icon to show or hide it"
                valueAtom={settingsShowInTaskbarAtom}
            />
            <ControlSwitch label="Quit the application when the window close button is clicked" valueAtom={settingsQuitOnCloseAtom} />
            <ControlShowThemeToggle />
        </div>
    );
}

function ControlSwitch({ label, valueAtom, className, ...rest }: ComponentProps<typeof Label> & { label: string; valueAtom: WritableAtom<boolean, [boolean], void | Promise<void>>; }) {
    const [checked, setChecked] = useAtom(valueAtom);

    return (
        <Label className={classNames("-ml-2 font-normal flex items-center gap-0", className)} {...rest}>
            <Switch className="scale-50" checked={checked} onCheckedChange={setChecked} />
            {label}
        </Label>
    );
}

function ControlShowThemeToggle() {
    const [showThemeToggle, setShowThemeToggle] = useAtom(settingsShowThemeToggleAtom);

    return (
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
    );
}
