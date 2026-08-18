import { useAtomValue } from "jotai";
import { isBackgroundAvailable } from "@renderer/api/isBackgroundAvailable";
import { Button } from "@renderer/components/ui/shadcn/button";
import { hostlifeBus } from "./a-bridge";
import { settingsQuitOnCloseAtom } from "./a-atoms";

export function ButtonExit() {
    const quitOnClose = useAtomValue(settingsQuitOnCloseAtom);
    if (!isBackgroundAvailable) {
        return null;
    }
    return (<>
        {!quitOnClose && (
            <Button
                type="button"
                variant="outline"
                size="xs"
                className="px-2 h-6 rounded"
                onClick={() => hostlifeBus.requestExit().catch(console.error)}
                title="Exit application"
            >
                Exit
            </Button>
        )}
    </>);
}
