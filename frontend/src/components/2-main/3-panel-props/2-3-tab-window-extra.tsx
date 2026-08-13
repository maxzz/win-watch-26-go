import { type WindowDetailInfo } from "./3-window-detail/9-types-window-info";
import {
    hex8,
    Mono,
    PropertyFullRow,
    PropertyGrid,
    PropertyHeader,
    PropertyRow,
    PropertySeparator,
    StyleList,
} from "./8-shared-ui";

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
