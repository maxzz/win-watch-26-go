import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";
import targetUrl from "@renderer/assets/icons/artboard-52-8.png";

export function WindowPickerTargetIcon({ className, ...rest }: HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={targetUrl}
            alt=""
            draggable={false}
            className={classNames("size-4 select-none pointer-events-none", className)}
            {...rest}
        />
    );
}
