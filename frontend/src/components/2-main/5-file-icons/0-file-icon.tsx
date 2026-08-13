import { useEffect, type ReactNode } from "react";
import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";

import { type FileIconEntry } from "./4-file-icons/9-types-icons";
import { ensureFileIcons, fileIconStore, normalizeFileIconPath } from "./4-file-icons/c-store-icons";

/**
 * Fixed-size file icon slot. Space is reserved even before the PNG arrives so
 * list rows and property rows do not jump when icons load in the background.
 * @param className - The class name to apply to the icon.
 * @param path - The path to the file to get the icon for. Like "c:\users\maxzz\appdata\local\programs\cursor\cursor.exe".
 * @param fallback - The fallback to use if the icon is not found i.e. Shown inside the fixed slot while loading / when missing.
 */
export function FileIcon({ path, className, fallback }: { className?: string; path: string | null | undefined; fallback?: ReactNode; }) {
    const entry = useFileIcon(path);

    return (
        <span className={classNames("shrink-0 inline-flex items-center justify-center", SLOT, className)} aria-hidden>
            {entry.status === "ready" && entry.dataUrl
                ? (
                    <img
                        src={entry.dataUrl}
                        alt=""
                        draggable={false}
                        className={classNames(SLOT, "object-contain")}
                    />
                )
                : (fallback ?? <span className={SLOT} />)
            }
        </span>
    );
}

const SLOT = "size-3.5"; // matches Windows list row icons — reserved always to avoid layout jump

/** 
 * Subscribes to the cached icon for path and kicks off a background fetch if needed. 
 * @param path - The path to the file to get the icon for. Like "c:\users\maxzz\appdata\local\programs\cursor\cursor.exe".
 * @returns The file icon entry.
 */
function useFileIcon(path: string | null | undefined): FileIconEntry {
    const key = normalizeFileIconPath(path);
    const byPath = useSnapshot(fileIconStore.byPath);

    useEffect(
        () => {
            if (!path?.trim()) return;
            ensureFileIcons([path]);
        },
        [path]);

    if (!key) {
        return emptyEntry;
    }

    return (byPath[key] as FileIconEntry | undefined) ?? emptyEntry;
}

const emptyEntry: FileIconEntry = { status: "idle", dataUrl: "" };
