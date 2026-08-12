import { type ReactNode } from "react";
import { classNames } from "@renderer/utils";
import { useFileIcon } from "./use-file-icon";

const SLOT = "size-3.5"; // matches Windows list row icons — reserved always to avoid layout jump

type FileIconProps = {
    path: string | null | undefined;
    className?: string;
    /** Shown inside the fixed slot while loading / when missing. */
    fallback?: ReactNode;
};

/**
 * Fixed-size file icon slot. Space is reserved even before the PNG arrives so
 * list rows and property rows do not jump when icons load in the background.
 */
export function FileIcon({ path, className, fallback }: FileIconProps) {
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
