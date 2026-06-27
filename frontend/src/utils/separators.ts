/**
 * Converts a value into a delimiter-separated string.
 * @param value - The number or string to convert as "1720102453".
 * @param nOfChars - The number of characters in each group.
 * @param delim - The delimiter to use.
 * @returns The number converted into a string with the delimiter.
 * @example
 * separators(1720102453, 3, '.') -> '1.720.102.453'
 */
export function separators(value: number | string | undefined, nOfChars: number = 3, delim: string = '.'): string {
    const s = value === undefined ? '' : String(value);
    if (!Number.isInteger(nOfChars) || nOfChars < 1) {
        return s;
    }
    return s.replace(new RegExp(`(?!^)(?=(?:.{${nOfChars}})+$)`, 'g'), delim);
}
// or
// export function separators(value: number | string | undefined, nOfChars: number = 3, delim: string = '.'): string {
//     const s = value === undefined ? '' : String(value);
//     return separatedArray(s, nOfChars).join(delim);
// }

/**
 * Converts string into groups of nOfChars characters from right to left the first group can be shorter.
 * Build groups from right to left, so the last group is always nOfChars long.
 * Example: "9800171", 3 -> ["9", "800", "171"].
 * @param s - The string to convert as "81D114F7F3E25DD91FB381F999800171".
 * @param nOfChars - The number of characters in each group.
 * @returns The string converted into groups of nOfChars characters.
 * @example
 * separatedArray("9800171", 3) -> ["9", "800", "171"].
 */
export function separatedArray(str: string | undefined, nOfChars: number = 3): string[] {
    const s = (str || '').trim();
    if (!s) {
        return [''];
    }

    if (!Number.isInteger(nOfChars) || nOfChars < 1) {
        return [s];
    }

    const groups: string[] = [];
    let end = s.length;
    while (end > nOfChars) {
        groups.unshift(s.slice(end - nOfChars, end));
        end -= nOfChars;
    }
    groups.unshift(s.slice(0, end));
    return groups;
}

/**
 * Splits a string into a front and last part.
 * @param str - The string to split as "9800171".
 * @param nOfChars - The number of characters in each group.
 * @returns The string split into a front and last part.
 * @example
 * frontAndLast("9800171", 3) -> ['9.800', '171']
 */
export function frontAndLast(str: string | number | undefined, nOfChars: number = 3): readonly [string, string] {
    if (!str) {
        return ['', ''];
    }
    let parts = separatedArray(str.toString(), nOfChars);
    const last = parts.pop();
    const front = parts.join('.');
    return [front || '', last || ''];
}
