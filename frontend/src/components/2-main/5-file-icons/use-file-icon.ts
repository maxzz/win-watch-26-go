import { useEffect } from "react";
import { useSnapshot } from "valtio/react";
import { type FileIconEntry } from "./4-file-icons/9-types-icons";
import { ensureFileIcons, fileIconStore, normalizeFileIconPath } from "./4-file-icons/c-store-icons";

const emptyEntry: FileIconEntry = { status: "idle", dataUrl: "" };

/** Subscribes to the cached icon for path and kicks off a background fetch if needed. */
export function useFileIcon(path: string | null | undefined): FileIconEntry {
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
