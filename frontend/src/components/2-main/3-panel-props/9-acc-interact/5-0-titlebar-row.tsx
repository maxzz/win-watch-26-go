import { type ReactNode } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { classNames } from "@renderer/utils";

import { type AccActionDef, type AccApiKind } from "./state/9-types";
import { doExecuteAccActionAtom } from "./state/a-atoms-acc-interact";
import { accInteractStore } from "./state/0-acc-interactions";
import { IconCaptionClose, IconCaptionMaximize, IconCaptionMinimize, IconCaptionRestore } from "./5-1-titlebar-icons";

export function AccTitleBarRow({ kind, actions }: { kind: AccApiKind; actions: readonly AccActionDef[]; }) {
    const byId = new Map(actions.map((action) => [action.id, action]));
    const ordered = titleBarOrder.map((id) => byId.get(id)).filter((action): action is AccActionDef => !!action);
    if (ordered.length === 0) {
        return null;
    }

    return (
        <div className="col-span-2 px-1.5 pl-2.5 py-0.5 flex items-center justify-between gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">
                Title Bar
            </span>
            <div className="inline-flex items-stretch border border-input rounded overflow-hidden">
                {ordered.map((action) => (
                    <AccTitleBarButton key={action.id} kind={kind} action={action} />
                ))}
            </div>
        </div>
    );
}

const titleBarOrder = ["window.setMinimized", "window.setMaximized", "window.setNormal", "window.close"] as const;

function AccTitleBarButton({ kind, action }: { kind: AccApiKind; action: AccActionDef; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const { busyActionId } = useSnapshot(accInteractStore);
    const busy = busyActionId === `${kind}:${action.id}`;
    const isClose = action.id === "window.close";

    return (
        <button
            className={classNames(titleBarButtonClasses, isClose ? "hover:bg-[#e81123] hover:text-white" : "hover:bg-accent hover:text-accent-foreground")}
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
size-6 \
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
