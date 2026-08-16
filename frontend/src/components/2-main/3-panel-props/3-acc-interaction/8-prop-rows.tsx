import { PropertyRow } from "../8-shared-ui";
import { type NamedValue } from "./state/9-types";

export function AccPatternHeader({ name }: { name: string; }) {
    return (
        <div className="contents">
            <div className="relative px-1.5 pl-2.5 flex items-center cursor-default select-none">
                <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-foreground/20" />
                <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-foreground/20" />
                <span className="relative z-10 px-1 -ml-1 bg-card text-[0.65rem] font-semibold">
                    {name}
                </span>
            </div>
            <div className="relative">
                <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-foreground/20" />
            </div>
        </div>
    );
}

export function AccNamedValues({ values }: { values: readonly NamedValue[]; }) {
    if (values.length === 0) {
        return null;
    }
    return (<>
        {values.map(
            (item) => (
                <PropertyRow key={item.name} label={item.name} title={item.value || undefined}>
                    {item.value ? item.value : <span className="text-muted-foreground italic">-</span>}
                </PropertyRow>
            )
        )}
    </>);
}
