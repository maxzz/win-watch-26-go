import { type WindowDetailInfo } from "./state-atoms/9-types-window-info";
import { hex8, Mono, PathWithCopy, PropertyGrid, PropertyHeader, PropertyRow, PropertySeparator, rectText } from "./8-shared-ui";
import { ReactNode } from "react";

export function TabGeneral({ info }: { info: WindowDetailInfo; }) {
    return (
        <PropertyGrid>
            <PropertyHeader>Window</PropertyHeader>
            <PropertySeparator />
            <PropertyRow label="Caption">{info.caption || <span className="text-muted-foreground/60">(empty)</span>}</PropertyRow>
            <PropertyRow label="Class">{info.className + (info.unicode ? "  (unicode)" : "")}</PropertyRow>
            <PropertyRow label="Handle"><Mono>{info.handle}</Mono></PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Style">
                <Mono>{hex8(info.style)}</Mono>{"  "}({info.visible ? "visible" : "hidden"}, {info.enabled ? "enabled" : "disabled"})
            </PropertyRow>
            <PropertyRow label="ExStyle"><Mono>{hex8(info.exStyle)}</Mono></PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Rectangle"><Mono>{rectText(info.rect)}</Mono></PropertyRow>
            <PropertyRow label="Client Rect"><Mono>{rectText(info.clientRect)}</Mono></PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Control ID"><Mono>{info.controlId}</Mono></PropertyRow>
            <PropertyRow label="Instance"><Mono>{info.instance}</Mono></PropertyRow>
            <PropertyRow label="User Data"><Mono>{info.userData}</Mono></PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Parent">
                <Mono>{info.parent.handle}</Mono>{info.parent.className ? ` — ${info.parent.className}` : ""}
            </PropertyRow>
            <PropertyRow label="Owner">
                <Mono>{info.owner.handle}</Mono>{info.owner.className ? ` — ${info.owner.className}` : ""}
            </PropertyRow>
            <PropertySeparator />

            <PropertyHeader>Process</PropertyHeader>
            <PropertySeparator />
            <PropertyRow label="Process ID">
                <Mono>{hex8(info.processId)}</Mono>  (<Mono>{info.processId}</Mono>)
            </PropertyRow>
            <PropertyRow label="Thread ID">
                <Mono>{hex8(info.threadId)}</Mono>  (<Mono>{info.threadId}</Mono>)
            </PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Name">{info.processName || <span className="text-muted-foreground/60">N/A</span>}</PropertyRow>
            <PropertyRow label="Path">
                <PathWithCopy path={info.processPath} />
            </PropertyRow>
            <PropertySeparator />
            <PropertyRow label="Bits">{info.bits ? `${info.bits}-bit` : <span className="text-muted-foreground/60">N/A</span>}</PropertyRow>
            <PropertyRow label="User">{info.userName || <span className="text-muted-foreground/60">N/A</span>}</PropertyRow>
            <PropertyRow label="Integrity">{integrityLabel(info.integrity)}</PropertyRow>
            <PropertySeparator />
        </PropertyGrid>
    );
}

function integrityLabel(level: string): ReactNode {
    switch (level) {
        case "high": return "High";
        case "medium": return "Medium";
        case "mediumplus": return "Medium Plus";
        case "low": return "Low";
        case "na": return "N/A";
        case "undetected":
        default:
            return <span className="text-muted-foreground/60">N/A</span>;
    }
}
