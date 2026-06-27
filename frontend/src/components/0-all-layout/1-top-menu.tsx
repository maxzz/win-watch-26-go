import { useSetAtom } from "jotai";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger, } from "../ui/shadcn/menubar";
import { dialogAboutOpenAtom, dialogOptionsOpenAtom } from "@renderer/store/2-ui-atoms";
import { IconMenuHamburger3 } from "../ui/icons";
import { ZoomControls } from "./2-zoom-controls";

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);

    return (
        <Menubar className="p-0 h-auto border-none shadow-none rounded-none bg-transparent">
            <MenubarMenu>
                <MenubarTrigger className="px-1.5 py-1">
                    <IconMenuHamburger3 className="size-4" />
                </MenubarTrigger>

                <MenubarContent>
                    <MenubarItem onClick={() => setOptionsOpen(true)}>
                        Options...
                    </MenubarItem>

                    <ZoomControls />

                    <MenubarItem onClick={() => setAboutOpen(true)}>
                        About
                    </MenubarItem>

                    <MenubarSeparator />

                    <MenubarItem variant="destructive" onClick={() => tmApi.quitApp()}>
                        Exit
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
