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
            <ControlCheckbox label="Run WinWatch elevated" valueAtom={settingsRunElevatedAtom} />
            <ControlCheckbox label="Make the window stay on top of all others" valueAtom={settingsStayOnTopAtom} />
            <ControlCheckbox
                label="Show application icon on the taskbar"
                title="When off, the window stays open but has no taskbar button; use the tray icon to show or hide it"
                valueAtom={settingsShowInTaskbarAtom}
            />
            <ControlCheckbox label="Quit the application when the window close button is clicked" valueAtom={settingsQuitOnCloseAtom} />
            <ControlCheckbox
                label="Show theme toggle button in header"
                title="Show the theme toggle button in the application header"
                valueAtom={settingsShowThemeToggleAtom}
            />
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
