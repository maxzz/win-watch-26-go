import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconControlPane({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            {/* background */}
            <rect
                x="2.58"
                y="2.58"
                width="18.84"
                height="18.84"
                rx="3.18"
                ry="3.18"
                fill="currentColor"
                opacity="0.30"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
            {/* lower edge */}
            <path
                d="M18.09,6.07v11.15c0,.6-.48,1.08-1.08,1.08H5.86"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="square"
                opacity="0.7"
            />
            {/* upper edge */}
            <path
                d="M5.86,18.3V7.15c0-.6.48-1.08,1.08-1.08h11.15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                opacity="0.5"
            />
        </svg>
    );
}
