import { PropertyRow, PropertySeparator } from "../8-shared-ui";
import { type NamedValue } from "./state/9-types";

export function AccPatternHeader({ name }: { name: string; }) {
    return (<>
        <PropertySeparator />

        <div className="col-span-2 px-1.5 pl-2.5 py-px mt-0.5 text-[0.65rem] font-semibold text-muted-foreground select-none">
            {name}
        </div>
    </>);
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
