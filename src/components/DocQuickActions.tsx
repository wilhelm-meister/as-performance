"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocWithRefs } from "@/lib/types";
import { convertQuoteAction, markPaidAction } from "@/app/(app)/belege/actions";

export function DocQuickActions({ doc }: { doc: DocWithRefs }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const canConvert = doc.type === "quote" && doc.status !== "accepted";
  const canPay = doc.type === "invoice" && doc.status === "open";

  if (!canConvert && !canPay) return null;

  return (
    <span className="inline-flex gap-1.5">
      {canConvert && (
        <button
          type="button"
          title="In Rechnung umwandeln"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(async () => {
              const r = await convertQuoteAction(doc.id);
              if (r.ok && r.invoiceId) {
                router.push(`/belege/${r.invoiceId}?ok=${encodeURIComponent("Angebot in Rechnung umgewandelt")}`);
              } else {
                router.refresh();
              }
            });
          }}
          className="border border-[#d7dbe0] bg-white rounded-md w-[26px] h-[26px] cursor-pointer text-[#1d8a4e] flex items-center justify-center hover:border-[#1d8a4e] hover:bg-[#f0f7f2] disabled:opacity-50"
        >
          →
        </button>
      )}
      {canPay && (
        <button
          type="button"
          title="Als bezahlt markieren"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(async () => {
              await markPaidAction(doc.id);
              router.refresh();
            });
          }}
          className="border border-[#d7dbe0] bg-white rounded-md w-[26px] h-[26px] cursor-pointer text-[#1d8a4e] flex items-center justify-center hover:border-[#1d8a4e] hover:bg-[#f0f7f2] disabled:opacity-50"
        >
          ✓
        </button>
      )}
    </span>
  );
}
