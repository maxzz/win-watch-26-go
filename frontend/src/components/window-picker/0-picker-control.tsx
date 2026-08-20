import { useEffect, type PointerEvent } from "react";
import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";
import { Button } from "@renderer/components/ui/shadcn/button";
import { WindowPickerTargetIcon } from "./1-target-icon";
import { startWindowPicker, subscribeWindowPickerReleased, windowPickerStore } from "./a-store";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster-in-status-bar";
import { type WindowPickerReleasedHandler } from "./9-types";

export function WindowPickerControl({
    className,
    onReleased,
}: {
    className?: string;
    onReleased?: WindowPickerReleasedHandler;
}) {
    const { active } = useSnapshot(windowPickerStore);

    useEffect(
        () => {
            if (!onReleased) {
                return;
            }
            return subscribeWindowPickerReleased(onReleased);
        },
        [onReleased]
    );

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={classNames(
                "size-6 shrink-0 rounded-sm active:scale-100",
                active && "border border-dashed border-muted-foreground/40"
            )}
            title={active ? "Release to pick the window under the cursor" : "Drag onto a window to inspect it"}
            aria-pressed={active}
            onPointerDown={onFinderPointerDown}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
        >
            <span className="size-4 grid place-items-center">
                {!active && <WindowPickerTargetIcon />}
            </span>
        </Button>
    );
}

function onFinderPointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (event.button !== 0) {
        return;
    }
    event.preventDefault();
    void startWindowPicker().then((ok) => {
        if (!ok) {
            notice.error("Failed to start window picker");
        }
    });
}
