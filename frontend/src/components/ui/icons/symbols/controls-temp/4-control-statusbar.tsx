import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconControlStatusbar({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            {/* window edge */}
            <line
                x1="1.96"
                y1="9.66"
                x2="1.96"
                y2="5.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
            {/* background fill */}
            <path
                d="M1.96,9.66h20.07v9.24H3.78c-1,0-1.82-.81-1.82-1.82v-7.42h0Z"
                fill="currentColor"
                opacity="0.12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
            {/* background border */}
            <path
                d="M1.96,9.66h20.07v9.24H3.78c-1,0-1.82-.81-1.82-1.82v-7.42h0Z"
                fill="none"
                //opacity="0.12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
        </svg>
    );
}
