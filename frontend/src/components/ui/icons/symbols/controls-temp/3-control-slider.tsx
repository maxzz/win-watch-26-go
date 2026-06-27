import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconControlSlider({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path
                d="M12.15,8.78v6.44c0,1.94-1.58,3.52-3.52,3.52h-.22c-1.95,0-3.53-1.58-3.53-3.52v-6.44c0-1.95,1.58-3.53,3.53-3.53h.22c1.94,0,3.52,1.58,3.52,3.53Z"
                fill="currentColor"
                opacity="0.12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />

            <line
                x1="22.68"
                y1="12.67"
                x2="12.14"
                y2="12.67"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeMiterlimit="10"
            />
            <line
                x1="4.88"
                y1="12.67"
                x2="1.32"
                y2="12.67"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeMiterlimit="10"
            />
        </svg>
    );
}
