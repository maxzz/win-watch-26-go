import { type WindowDetailInfo } from "@renderer/store/3-window-detail";
import { hex8, Mono, Row, Section, StyleList } from "./shared";

export function TabWindowExtra({ info }: { info: WindowDetailInfo; }) {
    return (
        <div className="p-2 space-y-3">
            <Section title="Class">
                <Row label="Class Name">{info.className}</Row>
                <Row label="Atom"><Mono>{info.classAtom}</Mono></Row>
                <Row label="Class Style"><Mono>{hex8(info.classStyle)}</Mono></Row>
                <Row label="Class Bytes"><Mono>{info.classExtraBytes}</Mono></Row>
                <Row label="Window Bytes"><Mono>{info.windowExtraBytes}</Mono></Row>
            </Section>

            <Section title="Style" grid={false}>
                <StyleList title="Window styles" hexValue={info.style} names={info.styleNames ?? []} />
                <StyleList title="Extended styles" hexValue={info.exStyle} names={info.exStyleNames ?? []} />
            </Section>
        </div>
    );
}
