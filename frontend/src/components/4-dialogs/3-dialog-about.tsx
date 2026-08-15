import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@renderer/components/ui/shadcn/dialog";
import gadgetUrl from "@renderer/assets/icons/gadget.svg";

export function DialogAbout({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="px-4 py-3 w-auto sm:max-w-100 text-xs">

                <DialogHeader>
                    <DialogTitle>
                        About
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Windows UI Automation Monitor.
                    </DialogDescription>
                </DialogHeader>


                <div className="text-xs grid grid-cols-[auto_1fr] gap-3 1items-center">
                    <a
                        className="p-1 bg-sky-50 dark:bg-sky-950 border-sky-500 border rounded shadow shadow-foreground/20 dark:shadow-foreground/30 active:scale-50 transition-all flex items-center justify-center"
                        href="https://github.com/maxzz/win-watch-25"
                        target="_blank"
                        rel="noreferrer"
                        title="Open GitHub Repository"
                    >
                        <img src={gadgetUrl} alt="logo" className="size-12 object-contain" />
                    </a>

                    <div className="grid gap-1">
                        <p className="pb-2 font-semibold">UI Automation Monitor</p>

                        <p>Build Date: {envModifiedDate()}</p>
                        <p>Version: {envBuildVersion()}</p>

                        <p className="text-[.5rem] text-muted-foreground">No Rights Reserved. No Copyright (c) 1986-2026</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
