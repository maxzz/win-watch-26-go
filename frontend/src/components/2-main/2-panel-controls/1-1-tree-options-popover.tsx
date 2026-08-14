import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { Settings } from "lucide-react";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { setHighlightBlinkCountAtom, setHighlightBorderColorAtom, setHighlightBorderWidthAtom, setShowEmptyBoundsNotificationAtom } from "@renderer/store/2-3-atoms-highlight";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Checkbox } from "@renderer/components/ui/shadcn/checkbox";
import { Input } from "@renderer/components/ui/shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "@renderer/components/ui/shadcn/popover";

export function TreeOptionsPopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="xs" title="Tree options" type="button">
                    <Settings className="size-3.5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-auto min-w-56">
                <div className="mx-auto text-xs font-semibold select-none">
                    Tree options
                </div>

                <Separator />

                <Block_HighlightOptions />
            </PopoverContent>
        </Popover>
    );
}

function Block_HighlightOptions() {
    const settings = useSnapshot(appSettings);
    const setHighlightBlinkCount = useSetAtom(setHighlightBlinkCountAtom);
    const setHighlightBorderWidth = useSetAtom(setHighlightBorderWidthAtom);
    const setHighlightBorderColor = useSetAtom(setHighlightBorderColorAtom);
    const setShowEmptyBoundsNotification = useSetAtom(setShowEmptyBoundsNotificationAtom);

    return (
        <div className="select-none flex flex-col">
            <div className="pb-1 text-xs font-semibold">
                Highlight Window Rectangle
            </div>

            <div className="pb-1 flex items-center gap-1">
                Blink:
                <OptionNumber
                    label="count"
                    title="Number of highlight blinks (1-10)"
                    value={settings.controls_highlightBlinks}
                    min={1}
                    max={10}
                    onChange={setHighlightBlinkCount}
                />
                <OptionNumber
                    label="border"
                    title="Highlight border width in pixels (1-20)"
                    value={settings.controls_highlightBorderWidth}
                    min={1}
                    max={20}
                    onChange={setHighlightBorderWidth}
                />
                <label className="text-xs select-none flex items-center justify-between gap-2" title="Highlight border color">
                    <input
                        type="color"
                        title="Highlight border color"
                        className="p-0 h-6 w-8 bg-transparent border border-border rounded cursor-pointer"
                        value={normalizeHexColor(settings.controls_highlightBorderColor)}
                        onChange={(e) => setHighlightBorderColor(normalizeHexColor(e.target.value))}
                    />
                </label>
            </div>

            <label className="text-xs select-none flex items-center gap-1.5 cursor-pointer" title="Show empty bounds / off-screen notice on the tree row">
                <Checkbox
                    checked={settings.controls_ShowEmptyBoundsNotice}
                    onCheckedChange={(v) => setShowEmptyBoundsNotification(v === true)}
                />
                Show inline empty bounds notice
            </label>
        </div>
    );
}

function Separator() {
    return <div className="-mx-2 h-px border-t border-border" />;
}

function OptionNumber({
    label,
    title,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    title?: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="text-xs select-none flex items-center justify-between gap-0.5" title={title}>
            <span>{label}</span>
            <Input
                type="number"
                className="px-1.5 h-6 w-10 text-xs tabular-nums"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) {
                        return;
                    }
                    onChange(Math.max(min, Math.min(max, Math.round(n))));
                }}
            />
        </label>
    );
}

function normalizeHexColor(color: string): string {
    const input = String(color ?? "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(input)) {
        return input.toLowerCase();
    }
    return "#ff0000";
}
