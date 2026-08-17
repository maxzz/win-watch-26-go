import { type WindowDetailInfo } from "./state-atoms/9-types-window-info";
import { hex8, Mono, PropertyFullRow, PropertyGrid, PropertyHeader, PropertyRow, PropertySeparator } from "./8-shared-ui";

export function TabWindowExtra({ info }: { info: WindowDetailInfo; }) {
    return (
        <PropertyGrid>
            <PropertyHeader>Class</PropertyHeader>
            <PropertySeparator />
            <PropertyRow label="Class Name">{info.className}</PropertyRow>
            <PropertyRow label="Atom"><Mono>{info.classAtom}</Mono></PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Class Style"><Mono>{hex8(info.classStyle)}</Mono></PropertyRow>
            <PropertyRow label="Class Bytes"><Mono>{info.classExtraBytes}</Mono></PropertyRow>
            <PropertyRow label="Window Bytes"><Mono>{info.windowExtraBytes}</Mono></PropertyRow>

            <PropertySeparator />
            <PropertyHeader>Style</PropertyHeader>
            <PropertyFullRow>
                <StyleList title="Window styles" hexValue={info.style} names={info.styleNames ?? []} />
            </PropertyFullRow>
            <PropertySeparator />
            <PropertyFullRow>
                <StyleList title="Extended styles" hexValue={info.exStyle} names={info.exStyleNames ?? []} />
            </PropertyFullRow>
            <PropertySeparator />
        </PropertyGrid>
    );
}

function StyleList({ title, hexValue, names }: { title: string; hexValue: number; names: string[]; }) {
    return (
        <div className="mb-2 last:mb-0 px-1.5">
            <div className="mb-1 text-xs">
                <span className="text-muted-foreground">{title}</span>
                {": "}
                <Mono>{hex8(hexValue)}</Mono>
            </div>
            
            {names.length === 0
                ? <div className="pl-2 text-xs text-muted-foreground">(none)</div>
                : (
                    <ul className="pl-2 text-xs space-y-0.5">
                        {names.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                )}
        </div>
    );
}
