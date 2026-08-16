import { type SVGAttributes } from "react";
import { classNames } from "@renderer/utils";

const iconProps = "size-3 shrink-0";

/** Windows caption Minimize — horizontal bar. */
export function IconCaptionMinimize({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <path d="M1 5h8" stroke="currentColor" strokeWidth="1" />
        </svg>
    );
}

/** Windows caption Maximize — single square. */
export function IconCaptionMaximize({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" strokeWidth="1" />
        </svg>
    );
}

/** Windows caption Restore — overlapping squares. */
export function IconCaptionRestore({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <rect x="3" y="1.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1" />
            <rect className="fill-card" x="1.5" y="3.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1" />
        </svg>
    );
}

/** Windows caption Close — X. */
export function IconCaptionClose({ className, ...rest }: SVGAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames(iconProps, className)} viewBox="0 0 10 10" fill="none" aria-hidden {...rest}>
            <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1" />
        </svg>
    );
}
