import { UISymbolDefsInject } from "pm-manifest-icons";
import { DefFieldTypes } from "pm-manifest-icons/src/symbols/fields";
// import { DefAppTypes } from "./app";
import { DefAllOtherTypes } from "./all-other";
import { DefUiAutomationTypes } from "./ui-automation";
import { DefControlTypes } from "./controls";

export * from "pm-manifest-icons/src/symbols/fields";
// export * from "./app";
export * from "./controls";
export * from "./all-other";
export * from "./ui-automation";

export function UISymbolDefs() {
    return (
        <UISymbolDefsInject>
            {DefFieldTypes()}
            {/* {DefAppTypes()} */}
            {DefAllOtherTypes()}
            {DefUiAutomationTypes()}
            {DefControlTypes()}
        </UISymbolDefsInject>
    );
}

// import { type ReactNode } from "react";

// export function UISymbolDefsInject({ children }: { children: ReactNode; }) {
//     return (
//         <svg
//             xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1"
//             id="svgfont" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
//         >
//             <defs>
//                 {children}
//             </defs>
//         </svg>
//     );
// }
