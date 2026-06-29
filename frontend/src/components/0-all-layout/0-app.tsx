import { useActiveWindow, useAppStartInitialize, useMonitorActiveWindow } from "@renderer/store/hooks/useActiveWindow";
import { Toaster } from "sonner";
import { UISymbolDefs } from "../ui/icons/symbols";
import { AppHeader } from "./1-app-header";
import { MainContent } from "./2-resizable-panels";
import { SpyAllIcons } from "@renderer/utils/util-hooks/spy-icons";
import { AppGlobals } from "../4-dialogs/0-app-globals";

export function App() {
    return (<>
        <UISymbolDefs />
        <Toaster />
        <AppGlobals />

        <AppContents />
    </>);
}

function AppContents() {
    useActiveWindow();
    useAppStartInitialize();
    useMonitorActiveWindow();

    return (
        <div className="w-screen h-screen text-foreground bg-background flex flex-col overflow-hidden">
            <AppHeader />
            {/* <SpyAllIcons includeSvgSymbols /> */}
            <MainContent className="flex-1" />
        </div>
    );
}
