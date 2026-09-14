// components/crm/StageBadge.tsx
import type { DealStage, DealStageConfig } from "@/types/crm/crm.types";

const FALLBACK: Record<DealStage, { label: string; color: string }> = {
  lead_in: { label: "Lead In", color: "#64748b" },
  qualified: { label: "Qualified", color: "#3b82f6" },
  proposal: { label: "Proposal", color: "#8b5cf6" },
  negotiation: { label: "Negotiation", color: "#f59e0b" },
  won: { label: "Won", color: "#10b981" },
  lost: { label: "Lost", color: "#ef4444" },
};

interface Props {
  stage: DealStage;
  config?: DealStageConfig;
  /** When true, always render the fallback label (never use a `config` override). */
  ignoreConfig?: boolean;
}

export function StageBadge({ stage, config, ignoreConfig }: Props) {
  const fallback = FALLBACK[stage];
  const label = ignoreConfig ? fallback.label : config?.label ?? fallback.label;
  const color = ignoreConfig ? fallback.color : config?.color ?? fallback.color;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}