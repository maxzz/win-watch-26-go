import { type HTMLAttributes } from "react"; // 02.15.26
import { classNames } from "../../classnames";
import { type SymbolItem } from "./7-collect-svg-symbols";

export function SpyTestAllSvgSymbols({ groups, idPrefix, className, ...rest }: { groups: Record<string, SymbolItem[]>; idPrefix?: string; } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={classNames("flex flex-col gap-4", className)} {...rest}>
            {Object.entries(groups).map(
                ([prefix, groupSymbols]) => (
                    <div key={prefix}>
                        {!idPrefix && (
                            <GroupHeader prefix={prefix} count={groupSymbols.length} />
                        )}

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(0,64px))] gap-2">
                            {groupSymbols.map(
                                ({ id, viewBox }) => <GroupSymbolItem key={id} id={id} viewBox={viewBox} />
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function GroupHeader({ prefix, count }: { prefix: string; count: number; }) {
    return (
        <div className="pb-1 text-xs font-semibold text-foreground">
            {prefix}{' '}

            <span className="font-normal">
                ({count})
            </span>
        </div>
    );
}

function GroupSymbolItem({ id, viewBox }: Pick<SymbolItem, "id" | "viewBox">) {
    return (
        <div>
            <div className="size-16 1bg-[#6c7a6a] border-gray-700 border-4 rounded">
                <svg viewBox={viewBox ?? "0 0 24 24"} className="w-full h-full fill-[#deb8f7] stroke-black stroke-[.5]">
                    <title>{`${id}`}</title>
                    <use xlinkHref={`#${id}`} />
                </svg>
            </div>

            <div className="min-h-8 text-[.65rem] text-foreground text-center">
                {id}
            </div>
        </div>
    );
}
