import { type ReactNode, useEffect, useRef, useState } from "react";
import { classNames } from "../../classnames";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

export function CopyToClipboardButton({ text, className, title, children }: { text: string; className?: string; title?: string; children: ReactNode; }) {
    const [copied, setCopied] = useState(false);
    const timeoutIdRef = useRef<number | null>(null);

    useEffect(
        () => {
            return () => {
                if (timeoutIdRef.current != null) {
                    window.clearTimeout(timeoutIdRef.current);
                }
            };
        },
        []);

    async function handleClick() {
        const ok = await copyToClipboard(text);
        if (ok) {
            setCopied(true);
            if (timeoutIdRef.current != null) {
                window.clearTimeout(timeoutIdRef.current);
            }
            timeoutIdRef.current = window.setTimeout(() => setCopied(false), 250); // Keep the whole feedback (in+out) around ~0.4s.
        }
    }

    return (
        <button className={classNames("relative overflow-hidden", className)} type="button" title={title} onClick={handleClick}>
            {children}

            <AnimatePresence>
                {copied && (
                    <motion.div
                        className="absolute inset-0 bg-emerald-600 text-white grid place-items-center"
                        key="copied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-0.5"
                            initial={{ scale: 0.75, opacity: 0, rotate: -6 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 750, damping: 28, mass: 0.55 }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 0.25, times: [0, 0.4, 1] }}
                            >
                                <Check className="size-5" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}

async function copyToClipboard(text: string): Promise<boolean> {
    // Modern async clipboard APIs (works with a user gesture like onClick)
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Failed to copy to clipboard", error); // If clipboard is blocked/unavailable, silently ignore (debug-only UX helper).
    }

    // Fallback: write() with ClipboardItem (still modern, but not always supported)
    try {
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
            const blob = new Blob([text], { type: "text/plain" });
            await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
            return true;
        }
    } catch (error) {
        console.error("Failed to copy to clipboard", error); // If clipboard is blocked/unavailable, silently ignore (debug-only UX helper).
    }

    return false;
}
