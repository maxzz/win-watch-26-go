import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/8-ui-settings";
import { isThemeDark, toggleTheme } from "@renderer/utils/theme-utils";
import { Button } from "../ui/shadcn/button";
import { IconThemeMoon, IconThemeSun } from "../ui/icons/normal";

export function ButtonThemeToggle() {
    const { ui_theme: theme } = useSnapshot(appSettings);
    const isDark = isThemeDark(theme);

    return (
        <Button
            className="size-6 rounded"
            variant="ghost"
            size="icon"
            onClick={() => toggleTheme(theme)}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
        >
            {isDark
                ? <IconThemeSun className="size-3 stroke-1!" />
                : <IconThemeMoon className="size-3 stroke-1!" />
            }
        </Button>
    );
}
