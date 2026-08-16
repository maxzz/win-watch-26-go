import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

export function useDelayedTrue(active: boolean, delayMs: number, resetKey?: string | null): boolean {
    const [ready, setReady] = useState(false);
    useEffect(
        () => {
            if (!active) {
                setReady(false);
                return;
            }
            setReady(false);
            const id = window.setTimeout(() => setReady(true), delayMs);
            return () => window.clearTimeout(id);
        },
        [active, delayMs, resetKey]);
    return ready && active;
}

export function AccReadingMessage({ children }: { children: ReactNode; }) {
    return (
        <motion.div
            className="px-2.5 py-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}
