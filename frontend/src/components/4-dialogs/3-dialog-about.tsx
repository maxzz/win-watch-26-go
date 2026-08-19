import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import { Button } from "../ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@renderer/components/ui/shadcn/dialog";
import gadgetUrl from "@renderer/assets/icons/gadget.svg";

export function DialogAbout({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="px-4 py-3 max-w-100 text-xs">

                <DialogHeader>
                    <DialogTitle>
                        About
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Windows UI Automation Monitor.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto_auto] gap-x-3 gap-y-2 text-xs">
                    <a
                        className="row-span-3 relative h-0 min-h-full w-24 overflow-hidden p-1 bg-sky-50 dark:bg-sky-950 border-sky-500 border rounded shadow shadow-foreground/20 dark:shadow-foreground/30 active:scale-50 transition-all"
                        href="https://github.com/maxzz/win-watch-25"
                        target="_blank"
                        rel="noreferrer"
                        title="Open GitHub Repository"
                    >
                        <img className="size-full object-contain" src={gadgetUrl} alt="logo" />
                    </a>

                    <div>
                        <p className="pb-2 font-semibold">
                            UI Automation Monitor
                        </p>
                        <p>
                            Windows apps do not expose a DOM. Buttons, tabs, and trees live behind
                            <a className="text-primary underline" href="https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32" target="_blank" rel="noreferrer"> UI Automation </a>
                            and Win32 — useful for accessibility, test automation, and debugging, and
                            almost invisible without a dedicated inspector.
                        </p>
                    </div>

                    <div>
                        <p>Build Date: {envModifiedDate()}</p>
                        <p>Version: {envBuildVersion()}</p>
                    </div>

                    <p className="text-[.5rem] text-muted-foreground">No Rights Reserved. No Copyright (c) 1986-2026</p>
                </div>

                <DialogFooter className="m-0 -mx-4 -mb-4 px-4 pb-3 pt-2 flex justify-center!">
                    <Button type="button" variant="outline" className="min-w-16 font-condensed font-normal" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
