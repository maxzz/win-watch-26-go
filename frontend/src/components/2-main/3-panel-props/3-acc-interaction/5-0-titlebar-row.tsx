import { type ReactNode, type SVGAttributes } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";

import { PropertyRow } from "../8-shared-ui";
import { type AccAction, type AccApiKind } from "./state/9-types";
import { interactStore } from "./state/0-acc-interactions";
import { doExecuteAccActionAtom } from "./state/a-atoms-acc-interact";

export function AccTitleBarRow({ kind, actions }: { kind: AccApiKind; actions: readonly AccAction[]; }) {
    const byId = new Map(actions.map((action) => [action.id, action]));
    const ordered = titleBarOrder.map((id) => byId.get(id)).filter((action): action is AccAction => !!action);
    if (ordered.length === 0) {
        return null;
    }

    return (
        <PropertyRow label="Title Bar" interactive>
            <div className="1py-0.5 inline-flex items-stretch border border-input rounded overflow-hidden">
                {ordered.map((action) => (
                    <AccTitleBarButton key={action.id} kind={kind} action={action} />
                ))}
            </div>
        </PropertyRow>
    );
}

const titleBarOrder = ["window.setMinimized", "window.setMaximized", "window.setNormal", "window.close"] as const;

function AccTitleBarButton({ kind, action }: { kind: AccApiKind; action: AccAction; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const { busyActionId } = useSnapshot(interactStore);
    const busy = busyActionId === `${kind}:${action.id}`;
    const isClose = action.id === "window.close";

    return (
        <button
            className={classNames(titleBarButtonClasses, isClose ? "hover:bg-[#e81123] hover:text-white rounded-r" : "hover:bg-accent hover:text-accent-foreground")}
            onClick={() => void execute({ kind, actionId: action.id })}
            disabled={!!busyActionId}
            title={action.label}
            aria-label={action.label}
            type="button"
        >
            {busy ? <span className="text-[0.6rem]">…</span> : titleBarIcons[action.id]}
        </button>
    );
}

const titleBarButtonClasses = "\
px-2 h-3 \
text-foreground/80 border-l border-input \
\
first:border-l-0 \
disabled:opacity-50 \
disabled:pointer-events-none \
cursor-pointer \
grid \
place-items-center";

const titleBarIcons: Record<string, ReactNode> = {
    "window.setMinimized": <IconCaptionMinimize />,
    "window.setMaximized": <IconCaptionMaximize />,
    "window.setNormal": <IconCaptionRestore />,
    "window.close": <IconCaptionClose />,
};

/** Windows caption Minimize — horizontal bar. */
function IconCaptionMinimize({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <path d="M1 6.5h8" />
        </svg>
    );
}

/** Windows caption Maximize — single square. */
function IconCaptionMaximize({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <rect x="1.5" y="1.5" width="7" height="7" rx="1" ry="1" />
        </svg>
    );
}

/** Windows caption Restore — overlapping squares. */
function IconCaptionRestore({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <rect x="3" y="1.5" width="5.5" height="5.5" rx="1" ry="1" />
            <rect className="fill-card" x="1.5" y="3.5" width="5.5" height="5.5" rx="1" ry="1" />
        </svg>
    );
}

/** Windows caption Close — X. */
function IconCaptionClose({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <path d="M2 2l6 6M8 2L2 8" />
        </svg>
    );
}

const iconProps = "size-2.25 shrink-0 stroke-current stroke-[.8]";
