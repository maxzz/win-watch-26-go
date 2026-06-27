import { atom } from "jotai";
import { atomFamily } from "jotai-family";

// Collected symbols atom for svg symbols

export const svgSymbolsAtom = atom<SymbolItem[]>([]);

export const setSvgSymbolsAtom = atom(
    null,
    (_get, set, { fontID }: { fontID: string; }) => {
        const raw = getRawDefs(fontID);
        const symbols = symbolsFromRawElements(raw);
        set(svgSymbolsAtom, symbols);
    }
);

export const svgSymbolGroupsAtom = atomFamily(
    (idPrefix?: string) =>
        atom(
            (get): Record<string, SymbolItem[]> => { // group name and symbols
                const symbols = get(svgSymbolsAtom);
                return groupSymbolsByPrefix(symbols, idPrefix);
            }
        )
);

/**
 * Get raw defs elements from font ID
 */
export function getRawDefs(fontID: string): Element[] {
    const defsChildren = document.querySelector(`#${fontID} > defs`)?.children;
    const raw = (defsChildren ? [...defsChildren] : []);
    return raw;
}

export type SymbolItem = {
    id: string;
    viewBox: string | null;
};

export function symbolsFromRawElements(raw: Element[], idPrefix?: string): SymbolItem[] {
    return raw
        .map((el) => {
            const id = el.id;
            if (!id) return null;
            return {
                id,
                viewBox: el.getAttribute("viewBox"),
            } satisfies SymbolItem;
        })
        .filter((v): v is SymbolItem => Boolean(v))
        .filter((v) => (idPrefix ? v.id.startsWith(idPrefix) : true))
        .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Group items by prefix
 * @param items - Symbol items
 * @param idPrefix - Prefix to group by
 * @returns Record of symbol items grouped by prefix
 * @example
 * const items = [
 *   { id: "control-button", viewBox: "0 0 24 24", tagName: "svg" },
 *   { id: "control-button-2", viewBox: "0 0 24 24", tagName: "svg" },
 * ];
 * const grouped = groupItemsByPrefix(items, "control");
 * console.log(grouped);
 * // { control: [
 * //      { id: "control-button", viewBox: "0 0 24 24", tagName: "svg" },
 * //      { id: "control-button-2", viewBox: "0 0 24 24", tagName: "svg" }
 * // ]}
 */
export function groupSymbolsByPrefix(symbols: SymbolItem[], idPrefix?: string): Record<string, SymbolItem[]> {
    const filtered = idPrefix ? symbols.filter((s) => s.id.startsWith(idPrefix)) : symbols;

    return filtered.reduce(
        (acc, item) => {
            const key = idPrefix ? idPrefix : getIdPrefixBucket(item.id);
            (acc[key] ??= []).push(item);
            return acc;
        },
        {} as Record<string, SymbolItem[]>
    );

    function getIdPrefixBucket(id: string) {
        const idx = id.indexOf("-");
        return idx > 0 ? id.slice(0, idx) : "(no-prefix)";
    }
}
