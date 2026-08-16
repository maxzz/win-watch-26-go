import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";

import { type ControlNode } from "@renderer/store/9-types-tmapi";
import { selectedHwndAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";
import { emptyMsaaSection, emptyUiaSection } from "./state/9-types";
import { doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { interactStore } from "./state/0-acc-interactions";
import { UiaInteractSection } from "./2-uia-section";
import { MsaaInteractSection } from "./3-msaa-section";

export function AccInteractSection({ control }: { control: ControlNode; }) {
    const hwnd = useAtomValue(selectedHwndAtom);
    const load = useSetAtom(doLoadAccInteractAtom);
    const { snapshot, loading, error } = useSnapshot(interactStore);

    useEffect(
        () => {
            void load();
        },
        [hwnd, control.runtimeId, load]);

    const uia = snapshot?.uia ?? emptyUiaSection();
    const msaa = snapshot?.msaa ?? emptyMsaaSection();

    return (
        <div className="mt-1">
            {error && !snapshot?.found
                ? (
                    <div className="px-2.5 py-1 text-xs text-destructive">
                        {error}
                    </div>
                )
                : null
            }
            <UiaInteractSection section={uia} loading={loading} />
            <MsaaInteractSection section={msaa} loading={loading} />
        </div>
    );
}
