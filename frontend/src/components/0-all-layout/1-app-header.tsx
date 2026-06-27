import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/8-ui-settings";
import { dialogOptionsOpenAtom } from "@renderer/store/2-ui-atoms";
import { PanelBottomIcon, PanelRightIcon, SettingsIcon } from "lucide-react";
import { Button } from "../ui/shadcn/button";
import { TopMenu } from "./1-top-menu";
import { ButtonThemeToggle } from "./3-5-btn-theme-toggle";

export function AppHeader({ className }: { className?: string; }) {
    return (
        <div className={classNames("px-3 py-1 border-b bg-muted/30 flex items-center justify-between", className)}>
            <div className="flex items-center gap-4">
                <TopMenu />
            </div>
            <div className="flex items-center gap-1">
                <ButtonOpenOptionsDialog />
                <ButtonThemeToggle />
                {/* <Button_TogglePropertiesPosition /> */}
            </div>
        </div>
    );
}

function ButtonOpenOptionsDialog() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);

    return (
        <Button
            className="size-6 rounded"
            variant="ghost"
            size="icon"
            onClick={() => setOptionsOpen(true)}
            title="Options"
            type="button"
        >
            <SettingsIcon className="size-3 stroke-1!" />
        </Button>
    );
}

function Button_TogglePropertiesPosition() {
    const settings = useSnapshot(appSettings);
    const isPropertiesOnRight = settings.ui_panels_PropPos === 'right';
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={() => appSettings.ui_panels_PropPos = settings.ui_panels_PropPos === 'bottom' ? 'right' : 'bottom'}
            title={isPropertiesOnRight ? "Move properties panel to bottom" : "Move properties panel to right"}
        >
            {isPropertiesOnRight ? <PanelBottomIcon className="size-4" /> : <PanelRightIcon className="size-4" />}
        </Button>
    );
}
