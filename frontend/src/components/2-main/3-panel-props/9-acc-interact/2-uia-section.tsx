import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { PropertyGrid } from "../8-shared-ui";
import { AccCollapsible } from "./1-collapsible";
import { AccCommandGroup } from "./4-action-row";
import { AccNamedValues, AccPatternHeader } from "./8-prop-rows";
import { doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { accInteractStore } from "./state/c-store-acc-interact";
import { type UiaSection } from "./state/9-types";

export function UiaInteractSection({ section, loading }: { section: UiaSection; loading: boolean; }) {
    const snap = useSnapshot(accInteractStore);
    const reload = useSetAtom(doLoadAccInteractAtom);
    const patternCount = section.patterns.length;

    return (
        <AccCollapsible
            open={snap.uiaOpen}
            onOpenChange={(open) => { accInteractStore.uiaOpen = open; }}
            title="UI Automation"
            subtitle={patternCount ? `${patternCount} pattern${patternCount === 1 ? "" : "s"}` : undefined}
            onRefresh={() => void reload({ force: true })}
            refreshDisabled={loading}
            refreshTitle="Get current UIA state"
        >
            {loading && !section.patterns.length && !section.actions.length
                ? <div className="px-2.5 py-1 text-xs text-muted-foreground">Reading patterns…</div>
                : (
                    <PropertyGrid>
                        <AccNamedValues values={section.properties} />
                        <AccCommandGroup kind="uia" actions={section.actions} />
                        {section.patterns.map((pattern) => (
                            <div key={pattern.id} className="contents">
                                <AccPatternHeader name={pattern.name} />
                                <AccNamedValues values={pattern.properties} />
                                <AccCommandGroup kind="uia" actions={pattern.actions} />
                            </div>
                        ))}
                        {patternCount === 0 && !loading
                            ? (
                                <div className="col-span-2 px-2.5 py-1 text-xs text-muted-foreground">
                                    No interactive UIA patterns on this element.
                                </div>
                            )
                            : null}
                    </PropertyGrid>
                )}
        </AccCollapsible>
    );
}
