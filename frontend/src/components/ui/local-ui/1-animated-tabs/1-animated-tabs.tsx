import { type ComponentProps } from "react";
import { useAtomValue, type Atom } from "jotai";
import { LayoutGroup, motion } from "motion/react";
import { classNames } from "@renderer/utils";
import { TabsList, TabsTrigger } from "@renderer/components/ui/shadcn/tabs";

type AnimatedTabsListProps = ComponentProps<typeof TabsList> & {
    layoutId: string; // Unique id for the sliding indicator within a LayoutGroup. For example, "animated-tab-outline".
};

export function AnimatedTabsList({ layoutId, className, children, ...rest }: AnimatedTabsListProps) {
    return (
        <LayoutGroup id={layoutId}>
            <TabsList className={classNames("bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg p-0.75", className)} {...rest}>
                {children}
            </TabsList>
        </LayoutGroup>
    );
}

type AnimatedTabsTriggerProps = ComponentProps<typeof TabsTrigger> & {
    /** Atom holding the active tab value (same as Tabs root). */
    valueAtom: Atom<string>;
};

export function AnimatedTabsTrigger({ className, children, value, valueAtom, ...rest }: AnimatedTabsTriggerProps) {
    const selectedValue = useAtomValue(valueAtom);
    const selected = selectedValue === value;

    return (
        <TabsTrigger className={classNames(animatedTabsTriggerClasses, selected ? "text-foreground" : "text-foreground/60 hover:text-foreground", className)} value={value} {...rest}>
            {selected && (
                <motion.div
                    layoutId="animated-tab-outline"
                    className="absolute inset-0 bg-background border border-border rounded-sm shadow-sm"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </TabsTrigger>
    );
}

const animatedTabsTriggerClasses = "\
relative h-[calc(100%-1px)] font-medium \
transition-none \
\
border-transparent \
bg-transparent \
shadow-none \
\
data-[state=active]:bg-transparent \
data-[state=active]:shadow-none \
\
dark:data-[state=active]:bg-transparent \
dark:data-[state=active]:border-transparent \
\
hover:bg-transparent \
";
