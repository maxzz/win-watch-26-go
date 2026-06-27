import { type ComponentType, type HTMLAttributes, type SVGProps } from "react"; // 02.16.26
import { classNames } from "../../classnames";
import { CopyToClipboardButton } from "./copy-to-clipboard-button";

type AllIcons = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export function SpyTestAllNormalIcons({ allIcons, className, iconsSizeClasses = "size-6", ...rest }: { allIcons: AllIcons; iconsSizeClasses?: string; } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={classNames("flex flex-wrap gap-2", className)} {...rest}>
            {Object.entries(allIcons).map(
                ([name, Icon]) => (
                    <div className="flex flex-col items-center" key={name}>
                        <CopyToClipboardButton text={name} className="border-sky-500 border rounded" title={`${name}\nClick to copy`}>
                            <Icon className={iconsSizeClasses} />
                        </CopyToClipboardButton>
                    </div>
                ))
            }
        </div>
    );
}
