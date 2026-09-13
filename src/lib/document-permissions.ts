import type { Doc } from "./types";

export function canDeleteDocument(doc: Pick<Doc, "type" | "status" | "sent_at" | "converted_to" | "locked">): boolean {
  if (doc.type === "quote") {
    return !doc.converted_to && (doc.status === "draft" || doc.status === "sent");
  }
  return !doc.sent_at && !doc.locked && doc.status === "open";
}
