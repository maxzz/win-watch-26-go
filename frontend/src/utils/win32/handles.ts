/**
 * Convert "0000000000350AEE" to "0x00350AEE" if length is 16 and first 8 are 0.
 * Convert "0x0000000000350AEE" to "0x00350AEE" if length is 18 and first are "0x00000000".
 * Otherwise return the original handle.
 * @param hwnd - The handle to convert
 * @returns The converted handle
 */
export function normalizeHwnd(hwnd: string): string {
    if (!hwnd) {
        return hwnd;
    }
    if (hwnd.length === 16 && hwnd.startsWith("00000000")) {
        return "0x" + hwnd.substring(8);
    }
    if (hwnd.length === 18 && hwnd.startsWith("0x00000000")) {
        return "0x" + hwnd.substring(10);
    }
    return hwnd;
}

export function asHexNumber({ value, prefix, digits }: { value: number; prefix?: boolean; digits?: number; }): string {
    let rv = value.toString(16).toUpperCase();
    if (digits) {
        rv = rv.padStart(digits, '0');
    }
    if (prefix) {
        rv = "0x" + rv;
    }
    return rv;
}

export function asHex({ value, prefix, digits }: { value: string; prefix?: boolean; digits?: number; }): string {
    const num = parseInt(value);
    if (isNaN(num)) {
        return value;
    }
    return asHexNumber({ value: num, prefix, digits });
}

/**
 * Convert runtime ID to hex numbers.
 * @param runtimeId - The runtime ID to convert as "42.3998860.4.-2147483647.3998860.-4.32".
 * @returns The runtime ID converted to hex numbers as "2A.17962A83.4.80000001.17962A83.FFFFFFFC.2A".
 */
export function hexAccRuntimeId(runtimeId: string | undefined): string {
    if (!runtimeId) {
        return "";
    }
    const parts = runtimeId.split('.');
    const hexParts = parts.map(
        (part) => {
            const num = parseInt(part, 10);
            if (isNaN(num)) {
                return part;
            }
            const numberToFormat = num < 0 ? (num >>> 0) : num; // convert negative number to unsigned integer
            return numberToFormat.toString(16).toUpperCase();
        }
    );
    return hexParts.join('.');
}

/**
 * Compare two window handles.
 * The handles are stringified as "0x000000001234ABCD" or "1234ABCD".
 * The handles are converted to bigint to avoid overflow and precision issues.
 * The handles are compared using the bigint equality.
 * The handles are converted back to string to return the result.
 * @param a - The first handle to compare
 * @param b - The second handle to compare
 * @returns True if the handles are equal, false otherwise
 */
export function areWindowHandlesEqual(a: string, b: string): boolean {
    if (a === b) {
        return true;
    }
    const parsedA = parseHwnd(a);
    if (parsedA === null) {
        return false;
    }
    const parsedB = parseHwnd(b);
    if (parsedB === null) {
        return false;
    }
    return parsedA === parsedB;
}

function parseHwnd(value: string): bigint | null { // bigint is used to avoid overflow and precision issues.
    const trimmed = value?.trim();
    if (!trimmed) {
        return null;
    }
    try {
        if (/^0x[0-9a-f]+$/i.test(trimmed)) {
            return BigInt(trimmed);
        }
        if (/^[0-9]+$/.test(trimmed)) {
            return BigInt(trimmed);
        }
        if (/^[0-9a-f]+$/i.test(trimmed)) {
            return BigInt(`0x${trimmed}`);
        }
    } catch {
        // ignore parse errors and fallback to string equality
    }
    return null;
}
