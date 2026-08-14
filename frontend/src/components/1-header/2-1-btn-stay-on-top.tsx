import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { Button } from "../ui/shadcn/button";
import { IconPictureInPicture } from "../ui/icons/normal";

export function ButtonStayOnTop() {
    const { ui_stayOnTop: stayOnTop } = useSnapshot(appSettings);

    return (
        <Button
            className={classNames("size-6 rounded", stayOnTop ? "text-current" : "text-foreground/75")}
            variant="ghost"
            size="icon"
            onClick={() => { appSettings.ui_stayOnTop = !stayOnTop; }}
            title={stayOnTop ? "Now is always on top" : "Now is not always on top"}
            type="button"
            aria-pressed={stayOnTop}
        >
            <IconPictureInPicture
                className="size-3.5"
                fillClasses={stayOnTop ? "fill-current" : undefined}
            />
        </Button>
    );
}
