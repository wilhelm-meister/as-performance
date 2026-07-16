import { STATUS_COLOR, STATUS_LABEL, effectiveStatus } from "@/lib/format";
import type { Doc } from "@/lib/types";

export function StatusBadge({ doc }: { doc: Pick<Doc, "type" | "status" | "due_date"> }) {
  const s = effectiveStatus(doc);
  return (
    <span
      className="inline-block px-[9px] py-[3px] rounded-[20px] text-[11.5px] font-semibold whitespace-nowrap bg-[#f0f0f2]"
      style={{ color: STATUS_COLOR[s] }}
    >
      {STATUS_LABEL[s]}
    </span>
  );
}
