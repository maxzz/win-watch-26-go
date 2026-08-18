import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@renderer/utils";

export function Select({ ...rest }: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...rest} />;
}

export function SelectValue({ ...rest }: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...rest} />;
}

const triggerClasses = "\
pl-2.5 pr-2 py-1 w-fit text-xs \
whitespace-nowrap \
bg-transparent \
transition-colors \
dark:bg-input/30 \
dark:hover:bg-input/50 \
focus-visible:border-ring \
focus-visible:ring-1 \
focus-visible:ring-ring/50 \
disabled:cursor-not-allowed \
disabled:opacity-50 \
data-placeholder:text-muted-foreground \
[&_svg]:pointer-events-none \
[&_svg]:shrink-0 \
[&_svg:not([class*='size-'])]:size-4 \
rounded-sm \
outline-none select-none \
border \
border-input \
flex items-center justify-between gap-1.5";

export function SelectTrigger({ className, children, ...rest }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
    return (
        <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(triggerClasses, className)} {...rest}>
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="size-4 text-muted-foreground pointer-events-none" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

const contentClasses = "\
relative px-1 py-1.5 min-w-36 \
text-popover-foreground \
bg-popover \
duration-100 \
data-[state=open]:animate-in \
data-[state=closed]:animate-out \
data-[state=closed]:fade-out-0 \
data-[state=open]:fade-in-0 \
data-[state=closed]:zoom-out-95 \
data-[state=open]:zoom-in-95 \
data-[side=bottom]:slide-in-from-top-2 \
data-[side=left]:slide-in-from-right-2 \
data-[side=right]:slide-in-from-left-2 \
data-[side=top]:slide-in-from-bottom-2 \
ring-1 \
ring-foreground/10 \
rounded-sm shadow-md \
overflow-x-hidden \
overflow-y-auto \
z-50";

export function SelectContent({ className, children, position = "popper", ...rest }: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                className={cn(contentClasses, className)}
                position={position}
                {...rest}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport className="p-0">
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

const selectItemClasses = "\
relative pr-8 pl-2 py-1 w-full text-xs \
focus:text-accent-foreground \
focus:bg-accent \
data-disabled:pointer-events-none \
data-disabled:opacity-50 \
rounded-md \
outline-hidden select-none cursor-default \
flex items-center gap-1.5";

export function SelectItem({ className, children, ...rest }: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item data-slot="select-item" className={cn(selectItemClasses, className)} {...rest}>
            <span className="absolute right-2 size-4 flex items-center justify-center pointer-events-none">
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="size-4 pointer-events-none" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectScrollUpButton({ className, ...rest }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton data-slot="select-scroll-up-button" className={cn("py-1 flex items-center justify-center", className)} {...rest}>
            <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({ className, ...rest }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton data-slot="select-scroll-down-button" className={cn("py-1 flex items-center justify-center", className)} {...rest}>
            <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}
