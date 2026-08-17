import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { cn } from "@renderer/utils";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Input } from "@renderer/components/ui/shadcn/input";
import { IconRefresh } from "@renderer/components/ui/icons";

import { PropertyRow } from "../8-shared-ui";
import { type AccAction, type AccApiKind } from "./state/9-types";
import { doExecuteAccActionAtom, doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { interactStore, setDraft } from "./state/0-acc-interactions";
import { AccTitleBarRow } from "./5-0-titlebar-row";

export function AccActionRow({ kind, action, className }: { kind: AccApiKind; action: AccAction; className?: string; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const { busyActionId } = useSnapshot(interactStore);
    const busy = busyActionId === `${kind}:${action.id}`;
    const disabled = !!busyActionId;

    if (action.kind === "command") {
        return (
            <Button
                className={cn("h-4 px-1.5 text-[0.65rem]", className)}
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

function AccSetValueRow({ kind, action, busy, disabled }: { kind: AccApiKind; action: AccAction; busy: boolean; disabled: boolean; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const reload = useSetAtom(doLoadAccInteractAtom);
    const snap = useSnapshot(interactStore);
    const value = snap.drafts[`${kind}:${action.id}`] ?? action.currentValue ?? "";

    return (
        <PropertyRow label={action.label} title={action.hint || action.label} interactive>
            <div className="flex items-center min-w-0 h-6 pl-1.5 pr-px rounded border border-input shadow-xs dark:bg-input/30 focus-within:ring-[1px] focus-within:ring-ring focus-within:border-transparent">
                <Input
                    className="h-full flex-1 border-0 bg-transparent shadow-none dark:bg-transparent px-0 text-[0.65rem] focus-visible:ring-0"
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
                    className="ml-1.5 size-5 rounded p-0 active:scale-100"
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
                    className="ml-0.5 h-5 px-1.5 rounded text-[0.65rem] active:scale-100"
                    size="xs"
                    variant="outline"
                    onClick={() => void execute({ kind, actionId: action.id, value })}
                    disabled={disabled}
                    type="button"
                >
                    {busy ? "…" : "Set"}
                </Button>
            </div>
        </PropertyRow>
    );
}

export function AccCommandGroup({ kind, actions }: { kind: AccApiKind; actions: readonly AccAction[]; }) {
    const titleBar = actions.filter((a) => a.group === "titlebar");
    const setters = actions.filter((a) => a.kind !== "command");
    const commands = actions.filter((a) => a.kind === "command" && a.group !== "titlebar");

    if (!titleBar.length && !commands.length && !setters.length) {
        return null;
    }

    return (<>
        <AccTitleBarRow kind={kind} actions={titleBar} />

        {!!commands.length && (
            <PropertyRow label="" interactive>
                <div className="py-0.5 flex flex-wrap gap-1">
                    {commands.map(
                        (action) => (
                            <AccActionRow key={action.id} kind={kind} action={action} />
                        )
                    )}
                </div>
            </PropertyRow>
        )}

        {setters.map(
            (action) => (
                <AccActionRow key={action.id} kind={kind} action={action} />
            )
        )}
    </>);
}
