import { useAtomValue } from "jotai";
import { MenubarItem } from "../ui/shadcn/menubar";
import { Button } from "../ui/shadcn/button";
import { IconZoomMinus, IconZoomPlus, IconZoomReset } from "../ui/icons";
import { zoomLevelAtom } from "@renderer/store/2-6-atoms-zoom";

export function ZoomControls() {
    const zoomLevel = useAtomValue(zoomLevelAtom);
    const zoomPercent = Math.round((1.2 ** zoomLevel) * 100);

    return (
        <MenubarItem
            className="justify-between focus:bg-transparent cursor-default"
            onSelect={(event) => event.preventDefault()}
        >
            <span className="text-xs font-normal">Zoom</span>

            <div className="flex items-center gap-1 border rounded-md p-0.5">
                <Button
                    className="size-6 rounded-sm"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void tmApi.zoomAction("out");
                    }}
                    title="Zoom Out"
                >
                    <IconZoomMinus className="size-3" />
                </Button>

                <span className="w-10 text-center text-xs tabular-nums">{zoomPercent}%</span>

                <Button
                    className="size-6 rounded-sm"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void tmApi.zoomAction("in");
                    }}
                    title="Zoom In"
                >
                    <IconZoomPlus className="size-3" />
                </Button>

                <Button
                    className="ml-1 size-6 rounded-sm"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void tmApi.zoomAction("reset");
                    }}
                    disabled={zoomLevel === 0}
                    title="Reset Zoom"
                >
                    <IconZoomReset className="size-3" />
                </Button>
            </div>
        </MenubarItem>
    );
}
