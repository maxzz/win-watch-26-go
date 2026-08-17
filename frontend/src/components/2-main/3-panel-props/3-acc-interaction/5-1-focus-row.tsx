import { PropertyRow } from "../8-shared-ui";
import { AccActionRow } from "./4-action-row";
import { type AccAction, type NamedValue } from "./state/9-types";

const HAS_FOCUS_NAME = "Has keyboard focus";
const FOCUSABLE_NAME = "Keyboard focusable";
const SET_FOCUS_ID = "element.setFocus";

export function AccFocusRow({ properties, actions }: { properties: readonly NamedValue[]; actions: readonly AccAction[]; }) {
    const hasFocus = isTrue(findValue(properties, HAS_FOCUS_NAME));
    const focusable = isTrue(findValue(properties, FOCUSABLE_NAME));
    const setFocus = actions.find((action) => action.id === SET_FOCUS_ID);
    const hasFocusProp = properties.some((item) => item.name === HAS_FOCUS_NAME);
    const hasFocusableProp = properties.some((item) => item.name === FOCUSABLE_NAME);

    if (!hasFocusProp && !hasFocusableProp && !setFocus) {
        return null;
    }

    return (
        <PropertyRow label={"Focus"} title={HAS_FOCUS_NAME} interactive>
            <div className="py-0.5 flex items-center flex-wrap gap-x-1 gap-y-0.5 min-w-0">
                {hasFocusableProp && (<>
                    <span className="text-[0.65rem] bg-muted rounded-md px-1.5 py-px border border-input" title={HAS_FOCUS_NAME}>
                        {hasFocus ? "Has Focus" : "No Focus"}
                    </span>
                    <span className="text-[0.65rem] bg-muted rounded-md px-1.5 py-px border border-input" title={FOCUSABLE_NAME}>
                        {focusable ? "Focusable" : "Not focusable"}
                    </span>
                </>)}

                {setFocus && <AccActionRow kind="uia" action={setFocus} />}
            </div>
        </PropertyRow>
    );
}

export function withoutFocusItems(properties: readonly NamedValue[], actions: readonly AccAction[]) {
    return {
        properties: properties.filter((item) => item.name !== HAS_FOCUS_NAME && item.name !== FOCUSABLE_NAME),
        actions: actions.filter((action) => action.id !== SET_FOCUS_ID),
    };
}

function findValue(properties: readonly NamedValue[], name: string): string | undefined {
    return properties.find((item) => item.name === name)?.value;
}

function isTrue(value: string | undefined): boolean {
    return value === "true";
}
