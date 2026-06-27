import { useAtomValue } from "jotai";
import { selectedHwndAtom, windowInfosAtom } from "@renderer/store/2-1-atoms-windows-list";
import { normalizeHwnd, asHexNumber } from "@renderer/utils";

export function FooterWindowInfo() {
    const windowInfos = useAtomValue(windowInfosAtom);
    const selectedHwnd = useAtomValue(selectedHwndAtom);

    // Find window info for active handle
    // This might be slow if list is huge, but fine for now
    // Also handle format mismatch (hex vs dec) might be an issue
    // I'll try to fuzzy match or normalized in the future
    const selectedWindow =
        windowInfos.find(w => w.handle == selectedHwnd) ||
        windowInfos.find(w => parseInt(w.handle) == parseInt(selectedHwnd || "0")) ||
        null;

    //console.log("ActiveWindowInfo", activeHandle, activeWindow, windowInfos);

    if (!selectedWindow) {
        return (
            <div className={panelClasses}>
                No window selected
            </div>
        );
    }

    return (
        <div className={panelClasses}>
            {/* <div className="min-w-[132px]">
                <span className="font-semibold">HWND: </span>
                {normalizeHwnd(selectedWindow.handle)}
            </div> */}

            <div>
                <span className="font-semibold">{selectedWindow.processName}</span>
                {' '}
                [PID={asHexNumber({ value: selectedWindow.processId, prefix: true })}]
            </div>

            <div>
                <span className="font-semibold">class: </span>
                {selectedWindow.className}
            </div>

            {/* <div className="flex-1 text-right truncate">
                <span className="font-semibold">Title: </span>
                "{activeWindow.title}"
            </div> */}
        </div>
    );
}

const panelClasses = "px-1 py-2 text-[.65rem] bg-muted/20 border-t border-foreground/20 flex items-center gap-2";
