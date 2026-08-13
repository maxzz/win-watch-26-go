import { type ReactNode } from "react";
import { classNames } from "@renderer/utils";
import { useFileIcon } from "./use-file-icon";

/**
 * Fixed-size file icon slot. Space is reserved even before the PNG arrives so
 * list rows and property rows do not jump when icons load in the background.
 * @param className - The class name to apply to the icon.
 * @param path - The path to the file to get the icon for.
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
