import { useAtomValue, useSetAtom } from "jotai";
import { isBackgroundAvailable } from "@renderer/api/isBackgroundAvailable";
import { IntegrityBadge, type IntegrityLevel } from "./2-integrity-badge";
import { appIsElevatedAtom, settingsRunElevatedAtom } from "./a-atoms";

/** WinWatch elevation badge — click toggles UAC restart, same as traytools. */
export function BadgeSelfIntegrity() {
    const isElevated = useAtomValue(appIsElevatedAtom);
    const setRunElevated = useSetAtom(settingsRunElevatedAtom);
    const level: IntegrityLevel | undefined = isElevated === null ? undefined : isElevated ? "high" : "medium";
    if (!isBackgroundAvailable) {
        return null;
    }
    const title = isElevated ? "Running elevated — click to restart as normal" : "Running normal — click to restart elevated";

    return (
        <button
            className="focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 outline-hidden rounded-full"
            onClick={() => {
                if (isElevated === null) {
                    return;
                }
                setRunElevated(!isElevated);
            }}
            disabled={isElevated === null}
            title={title}
            aria-label={title}
            type="button"
        >
            <IntegrityBadge level={level} subject="WinWatch" className="cursor-pointer" title={title} />
        </button>
    );
}
