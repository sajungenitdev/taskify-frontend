// components/crm/TagBadge.tsx
import type { ContactTag } from "@/types/crm/crm.types";

const styles: Record<ContactTag, string> = {
  hot: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  warm: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  cold: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
};

export function TagBadge({ tag }: { tag: ContactTag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[tag]}`}
    >
      {tag}
    </span>
  );
}