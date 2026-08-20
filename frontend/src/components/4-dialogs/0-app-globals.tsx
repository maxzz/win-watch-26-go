import { useAtom } from "jotai";
import { dialogOptionsOpenAtom } from "@renderer/store/1-1-ui-atoms";
import { dialogAboutOpenAtom } from "@renderer/store/1-1-ui-atoms";
import { WindowLifecycleSync } from "@renderer/components/window-lifecycle";
import { WindowPickerSync } from "@renderer/components/window-picker";
import { DialogOptions } from "./1-dialog-options";
import { DialogAbout } from "./3-dialog-about";

export function AppGlobals() {
    const [optionsOpen, setOptionsOpen] = useAtom(dialogOptionsOpenAtom);
    const [aboutOpen, setAboutOpen] = useAtom(dialogAboutOpenAtom);
    return (<>
        <WindowLifecycleSync />
        <WindowPickerSync />
        <DialogOptions open={optionsOpen} onOpenChange={setOptionsOpen} />
        <DialogAbout open={aboutOpen} onOpenChange={setAboutOpen} />
    </>);
}
