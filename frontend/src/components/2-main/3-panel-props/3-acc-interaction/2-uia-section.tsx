import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-0-ui-settings";
import { PropertyGrid } from "../8-shared-ui";
import { AccCollapsible } from "./8-shared-ui-collapsible";

import { AccCommandGroup } from "./4-action-row";
import { AccNamedValues, AccPatternHeader } from "./8-prop-rows";
import { doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { interactStore } from "./state/0-acc-interactions";
import { type UiaSection } from "./state/9-types";

export function UiaInteractSection({ section, loading }: { section: UiaSection; loading: boolean; }) {
    const snap = useSnapshot(interactStore);
    const { ui_panels_UiaOpen: uiaOpen } = useSnapshot(appSettings);
    const reload = useSetAtom(doLoadAccInteractAtom);
    const patternCount = section.patterns?.length ?? 0;
    const subtitle = patternCount ? `${patternCount} pattern${patternCount === 1 ? "" : "s"}` : "no patterns";

    return (
        <AccCollapsible
            open={uiaOpen}
            onOpenChange={(open) => { appSettings.ui_panels_UiaOpen = open; }}
            title="UI Automation"
            subtitle={subtitle}
            loading={loading}
            loadingKey={snap.key}
            onRefresh={() => void reload({ force: true })}
            refreshDisabled={loading}
            refreshTitle="Get current UIA state"
        >
            <PropertyGrid>
                <AccNamedValues values={section.properties} />
                <AccCommandGroup kind="uia" actions={section.actions} />

                {section.patterns.map(
                    (pattern) => (
                        <div key={pattern.id} className="contents">
                            <AccPatternHeader name={pattern.name} />
                            <AccNamedValues values={pattern.properties} />
                            <AccCommandGroup kind="uia" actions={pattern.actions} />
                        </div>
                    )
                )}

                {patternCount === 0 && (
                    <div className="col-span-2 px-2.5 py-1 text-xs text-muted-foreground">
                        No interactive UIA patterns on this element.
                    </div>
                )}
            </PropertyGrid>
        </AccCollapsible>
    );
}
