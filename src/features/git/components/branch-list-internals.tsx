import { cn } from "@/lib/utils";

export function BranchSelectRow({
  name,
  isHead,
  selected,
  onToggle,
}: {
  name: string;
  isHead: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[10px] border border-[#E4E4E7] bg-white px-2.5 py-2",
        isHead && "border-[#5946DB]/40 bg-[#F6F5FF]/35",
      )}
      data-current={isHead ? "true" : "false"}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="size-4 shrink-0 rounded border-[#E4E4E7] accent-[#5946DB]"
          data-testid={`branch-check-${name}`}
        />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#18181B]">
          {name}
        </span>
      </label>
      {isHead ? (
        <span className="rounded-md bg-[#5946DB]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5946DB]">
          HEAD
        </span>
      ) : null}
    </li>
  );
}
