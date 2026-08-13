import { createContext, useContext, type ComponentProps } from "react";
import { LayoutGroup, motion } from "motion/react";
import { classNames } from "@renderer/utils";
import { TabsList, TabsTrigger } from "@renderer/components/ui/shadcn/tabs";

type AnimatedTabsContextValue = {
    value: string;
    layoutId: string;
};

const AnimatedTabsContext = createContext<AnimatedTabsContextValue | null>(null);

type AnimatedTabsListProps = ComponentProps<typeof TabsList> & {
    /** Controlled active tab value (same as Tabs root). */
    value: string;
    /** Unique id for the sliding indicator within a LayoutGroup. */
    layoutId?: string;
};

export function AnimatedTabsList({
    value,
    layoutId = "animated-tab-outline",
    className,
    children,
    ...rest
}: AnimatedTabsListProps) {
    return (
        <LayoutGroup id={layoutId}>
            <AnimatedTabsContext.Provider value={{ value, layoutId }}>
                <TabsList
                    className={classNames(
                        "bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg p-0.75",
                        className
                    )}
                    {...rest}
                >
                    {children}
                </TabsList>
            </AnimatedTabsContext.Provider>
        </LayoutGroup>
    );
}

type AnimatedTabsTriggerProps = ComponentProps<typeof TabsTrigger>;

export function AnimatedTabsTrigger({ className, children, value, ...rest }: AnimatedTabsTriggerProps) {
    const ctx = useContext(AnimatedTabsContext);
    if (!ctx) {
        throw new Error("AnimatedTabsTrigger must be used within AnimatedTabsList");
    }

    const selected = ctx.value === value;

    return (
        <TabsTrigger className={classNames(animatedTabsTriggerClasses, selected ? "text-foreground" : "text-foreground/60 hover:text-foreground", className)} value={value} {...rest}>
            {selected && (
                <motion.div
                    layoutId={ctx.layoutId}
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
