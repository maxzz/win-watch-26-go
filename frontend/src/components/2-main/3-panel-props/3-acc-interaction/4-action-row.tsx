import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Input } from "@renderer/components/ui/shadcn/input";
import { IconRefresh } from "@renderer/components/ui/icons";

import { type AccActionDef, type AccApiKind } from "./state/9-types";
import { doExecuteAccActionAtom, doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { interactStore, setDraft } from "./state/0-acc-interactions";
import { AccTitleBarRow } from "./5-0-titlebar-row";

export function AccActionRow({ kind, action }: { kind: AccApiKind; action: AccActionDef; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const { busyActionId } = useSnapshot(interactStore);
    const busy = busyActionId === `${kind}:${action.id}`;
    const disabled = !!busyActionId;

    if (action.kind === "command") {
        return (
            <Button
                size="xs"
                variant={action.destructive ? "destructive" : "outline"}
                disabled={disabled}
                title={action.hint || action.label}
                onClick={() => void execute({ kind, actionId: action.id })}
                type="button"
            >
                {busy ? "…" : action.label}
            </Button>
        );
    }

    return (
        <AccSetValueRow kind={kind} action={action} busy={busy} disabled={disabled} />
    );
}

function AccSetValueRow({ kind, action, busy, disabled }: { kind: AccApiKind; action: AccActionDef; busy: boolean; disabled: boolean; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const reload = useSetAtom(doLoadAccInteractAtom);
    const snap = useSnapshot(interactStore);
    const value = snap.drafts[`${kind}:${action.id}`] ?? action.currentValue ?? "";

    return (
        <div className="flex items-center gap-1 min-w-0">
            <span className="shrink-0 text-muted-foreground w-22 truncate" title={action.hint || action.label}>
                {action.label}
            </span>

            <Input
                className="h-6 px-1.5 text-[0.65rem]"
                type="text"
                inputMode={action.kind === "setNumber" ? "decimal" : undefined}
                placeholder={action.placeholder}
                title={action.hint || action.placeholder}
                value={value}
                disabled={disabled}
                onChange={(e) => setDraft(kind, action.id, e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        void execute({ kind, actionId: action.id, value });
                    }
                }}
            />

            <Button
                className="shrink-0"
                size="xs"
                variant="outline"
                onClick={() => void reload({ force: true })}
                disabled={disabled || snap.loading}
                title={`Get current ${action.label.toLowerCase()}`}
                type="button"
            >
                <IconRefresh className="size-2.5" />
            </Button>

            <Button
                size="xs"
                variant="outline"
                onClick={() => void execute({ kind, actionId: action.id, value })}
                disabled={disabled}
                type="button"
            >
                {busy ? "…" : "Set"}
            </Button>
        </div>
    );
}

export function AccCommandGroup({ kind, actions }: { kind: AccApiKind; actions: readonly AccActionDef[]; }) {
    const titleBar = actions.filter((a) => a.group === "titlebar");
    const commands = actions.filter((a) => a.kind === "command" && a.group !== "titlebar");
    const setters = actions.filter((a) => a.kind !== "command");
    if (titleBar.length === 0 && commands.length === 0 && setters.length === 0) {
        return null;
    }
    return (
        <div className="col-span-2 space-y-0.5">
            <AccTitleBarRow kind={kind} actions={titleBar} />

            {commands.length > 0
                ? (
                    <div className="px-1.5 pl-2.5 py-0.5 flex flex-wrap gap-1">
                        {commands.map(
                            (action) => (
                                <AccActionRow key={action.id} kind={kind} action={action} />
                            )
                        )}
                    </div>
                )
                : null
            }

            {setters.length > 0
                ? (
                    <div className="px-1.5 pl-2.5 py-0.5 space-y-0.5">
                        {setters.map(
                            (action) => (
                                <AccActionRow key={action.id} kind={kind} action={action} />
                            )
                        )}
                    </div>
                )
                : null
            }
        </div>
    );
}
