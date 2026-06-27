import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { IconMicroscope } from "../ui/icons";

export function DialogAbout({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="px-4 py-3 w-auto sm:max-w-[400px] text-xs">

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
                        className="bg-sky-50 dark:bg-sky-950 border-sky-500 border rounded shadow shadow-foreground/20 dark:shadow-foreground/30 active:scale-50 transition-all flex items-center justify-center"
                        href="https://github.com/maxzz/win-watch-25"
                        target="_blank"
                        rel="noreferrer"
                        title="Open GitHub Repository"
                    >
                        <IconMicroscope className="p-1 size-12 stroke-[3px]! stroke-sky-500 dark:stroke-sky-400" />
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
