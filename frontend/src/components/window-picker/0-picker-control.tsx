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
    const snap = useSnapshot(windowPickerStore);
    const active = snap.active;

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
        <div className={classNames("min-w-0 flex items-center gap-1.5", className)}>
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className={classNames(
                    "size-6 shrink-0 rounded-sm active:scale-100",
                    active ? "bg-transparent border border-dashed border-muted-foreground/40" : "bg-black hover:bg-black"
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

            {active && (
                <span
                    className="min-w-0 text-[0.65rem] tabular-nums text-muted-foreground truncate"
                    title={readoutTitle(snap.processName, snap.screen.x, snap.screen.y, snap.client.x, snap.client.y)}
                >
                    <span className="text-foreground">{snap.screen.x}, {snap.screen.y}</span>
                    {snap.processName ? <span>{`  ${snap.processName}`}</span> : null}
                </span>
            )}
        </div>
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

function readoutTitle(processName: string, sx: number, sy: number, cx: number, cy: number): string {
    const process = processName || "(no window)";
    return `${process}\nScreen: ${sx}, ${sy}\nClient: ${cx}, ${cy}`;
}
