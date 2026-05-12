import { cn } from "@/lib/utils";

export function BranchRow({
  name,
  isHead,
  onPickBase,
  onPickCompare,
}: {
  name: string;
  isHead: boolean;
  onPickBase: () => void;
  onPickCompare: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[10px] border border-[#E4E4E7] bg-white px-2.5 py-2",
        isHead && "border-[#5946DB]/40 bg-[#F6F5FF]/35",
      )}
      data-current={isHead ? "true" : "false"}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#18181B]">
        {name}
      </span>
      {isHead ? (
        <span className="rounded-md bg-[#5946DB]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5946DB]">
          HEAD
        </span>
      ) : null}
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-[6px] border border-[#E4E4E7] px-2 py-0.5 font-mono text-[11px] font-medium text-[#71717A] hover:bg-[#F4F4F5]"
          onClick={onPickBase}
        >
          Base
        </button>
        <button
          type="button"
          className="rounded-[6px] border border-[#E4E4E7] px-2 py-0.5 font-mono text-[11px] font-medium text-[#71717A] hover:bg-[#F4F4F5]"
          onClick={onPickCompare}
        >
          Comparar
        </button>
      </div>
    </li>
  );
}
