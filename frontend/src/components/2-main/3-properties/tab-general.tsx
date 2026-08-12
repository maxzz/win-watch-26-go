import { type WindowDetailInfo } from "@renderer/store/3-window-detail";
import { hex8, integrityLabel, Mono, PathWithCopy, rectText, Row, Section } from "./shared";

export function TabGeneral({ info }: { info: WindowDetailInfo; }) {
    return (
        <div className="p-2 space-y-3">
            <Section title="Window">
                <Row label="Caption">{info.caption || <span className="text-muted-foreground/60">(empty)</span>}</Row>
                <Row label="Class">{info.className + (info.unicode ? "  (unicode)" : "")}</Row>
                <Row label="Handle"><Mono>{info.handle}</Mono></Row>
                <Row label="Style"> <Mono>{hex8(info.style)}</Mono> {"  "}({info.visible ? "visible" : "hidden"}, {info.enabled ? "enabled" : "disabled"})</Row>
                <Row label="ExStyle"><Mono>{hex8(info.exStyle)}</Mono></Row>
                <Row label="Rectangle"><Mono>{rectText(info.rect)}</Mono></Row>
                <Row label="Client Rect"><Mono>{rectText(info.clientRect)}</Mono></Row>
                <Row label="Control ID"><Mono>{info.controlId}</Mono></Row>
                <Row label="Instance"><Mono>{info.instance}</Mono></Row>
                <Row label="User Data"><Mono>{info.userData}</Mono></Row>
                <Row label="Parent"><Mono>{info.parent.handle}</Mono>{info.parent.className ? ` — ${info.parent.className}` : ""}</Row>
                <Row label="Owner"><Mono>{info.owner.handle}</Mono>{info.owner.className ? ` — ${info.owner.className}` : ""}</Row>
            </Section>

            <Section title="Process">
                <Row label="Process ID"><Mono>{hex8(info.processId)}</Mono>  (<Mono>{info.processId}</Mono>)</Row>
                <Row label="Thread ID"><Mono>{hex8(info.threadId)}</Mono>  (<Mono>{info.threadId}</Mono>)</Row>
                <Row label="Name">{info.processName || <span className="text-muted-foreground/60">N/A</span>}</Row>
                <Row label="Path">
                    <PathWithCopy path={info.processPath} />
                </Row>
                <Row label="Bits">{info.bits ? `${info.bits}-bit` : <span className="text-muted-foreground/60">N/A</span>}</Row>
                <Row label="User">{info.userName || <span className="text-muted-foreground/60">N/A</span>}</Row>
                <Row label="Integrity">{integrityLabel(info.integrity)}</Row>
            </Section>
        </div>
    );
}
