import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconZoomPlus({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current stroke-2", className)} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
