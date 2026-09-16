// app/(dashboard)/tenders/manage/page.tsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TenderHeader } from "@/components/tender/TenderHeader";
import { TenderStats } from "@/components/tender/TenderStats";
import { TenderTabs, type TenderTab } from "@/components/tender/TenderTabs";
import {
  TenderTable,
  TenderTypeBadge,
  DocsStatusBadge,
  DeadlineCell,
} from "@/components/tender/TenderTable";
import { TenderDetailReview } from "@/components/tender/TenderDetailReview";
import { TenderDetailActive } from "@/components/tender/TenderDetailActive";
import { TenderDetailSubmitted } from "@/components/tender/TenderDetailSubmitted";
import { TenderDetailLost } from "@/components/tender/TenderDetailLost";
import { AddTenderModal } from "@/components/tender/modal/AddTenderModal";
import { EditTenderModal } from "@/components/tender/modal/EditTenderModal";
import { EligibilityCheckModal } from "@/components/tender/documents/modal/EligibilityCheckModal";
import { SubmissionChecklistModal } from "@/components/tender/modal/SubmissionChecklistModal";
import { useTenderStats } from "@/hooks/tender/useTenders";
import {
  toReviewDetail,
  toActiveDetail,
  toSubmittedDetail,
  toLostDetail,
} from "@/lib/api/tender.mapper";
import type { Tender } from "@/lib/api/tender.api";
import { tenderApi } from "@/lib/api/tender.api";
import { confirmToast } from "@/lib/confirmToast";

/* ---------- Column schemas ---------- */
const COLUMNS_POTENTIAL = [
  { key: "tenderer", label: "Tenderer", width: "20%" },
  { key: "description", label: "Description", width: "34%" },
  { key: "type", label: "Type", width: "10%" },
  { key: "recorded", label: "Recorded", width: "14%" },
  { key: "budget", label: "Tentative Budget", width: "16%" },
];

const COLUMNS_ACTIVE = [
  { key: "tenderer", label: "Tenderer", width: "32%" },
  { key: "type", label: "Type", width: "10%" },
  { key: "deadline", label: "Deadline", width: "14%" },
  { key: "value", label: "Value", width: "16%" },
  { key: "status", label: "Docs Status", width: "14%" },
];

const COLUMNS_SUBMITTED = [
  { key: "tenderer", label: "Tenderer", width: "20%" },
  { key: "description", label: "Description", width: "40%" },
  { key: "submitted", label: "Submitted", width: "15%" },
  { key: "awaiting", label: "Awaiting Result Since", width: "20%" },
];

const COLUMNS_LOST = [
  { key: "tenderer", label: "Tenderer", width: "18%" },
  { key: "description", label: "Description", width: "30%" },
  { key: "reason", label: "Loss Reason", width: "32%" },
  { key: "date", label: "Date", width: "12%" },
];

/* ---------- Helpers ---------- */
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(d?: string) {
  if (!d) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(d).getTime() - Date.now()) / 86400000),
  );
}

function budgetLabel(n?: number) {
  if (!n) return "—";
  return `৳${n.toLocaleString("en-IN")}`;
}

function mapRows(
  stage: "potential" | "active" | "submitted" | "lost",
  tenders: Tender[],
) {
  return tenders.map((t) => {
    if (stage === "potential") {
      return {
        id: t._id,
        cells: {
          tenderer: t.tenderer,
          description: t.title,
          type: <TenderTypeBadge type={t.tenderType} />,
          recorded: fmtDate(t.createdAt),
          budget: budgetLabel(t.tentativeBudget),
        },
      };
    }
    if (stage === "active") {
      return {
        id: t._id,
        cells: {
          tenderer: t.tenderer,
          type: <TenderTypeBadge type={t.tenderType} />,
          deadline: <DeadlineCell days={daysLeft(t.lastDateOfSubmission)} />,
          value: t.tentativeBudget ? budgetLabel(t.tentativeBudget) : "—",
          status: (
            <DocsStatusBadge
              status={(t.docStatus as any) ?? "Pending"}
            />
          ),
        },
      };
    }
    if (stage === "submitted") {
      return {
        id: t._id,
        cells: {
          tenderer: t.tenderer,
          description: t.title,
          submitted: fmtDate(t.submittedAt ?? t.updatedAt),
          awaiting: `${daysLeft(t.submittedAt)} days`,
        },
      };
    }
    return {
      id: t._id,
      cells: {
        tenderer: t.tenderer,
        description: t.title,
        reason: t.lossReason || "—",
        date: fmtDate(t.lostAt ?? t.updatedAt),
      },
    };
  });
}

/* ---------- Page ---------- */
export default function TenderManagePage() {
  const { groups, stats, loading, refetch } = useTenderStats();
  const [tab, setTab] = useState<TenderTab>("potential");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTender, setEditTender] = useState<Tender | null>(null);
  const [eligibilityTender, setEligibilityTender] = useState<Tender | null>(
    null,
  );
  const [checklistTender, setChecklistTender] = useState<Tender | null>(
    null,
  );

  const currentRows = groups[tab] ?? [];
  const selected =
    currentRows.find((t) => t._id === selectedId) ?? currentRows[0] ?? null;

  const counts = useMemo(
    () => ({
      potential: groups.potential.length,
      active: groups.active.length,
      submitted: groups.submitted.length,
      lost: groups.lost.length,
    }),
    [groups],
  );

  const handleTabChange = (next: TenderTab) => {
    setTab(next);
    setSelectedId(null);
  };

  /* ---------- Lookup ---------- */
  const findTenderById = (id: string): Tender | undefined =>
    Object.values(groups)
      .flat()
      .find((x) => x._id === id);

  /* ---------- Delete ---------- */
  const handleDelete = (id: string) => {
    const tender = findTenderById(id);
    confirmToast({
      title: `Delete ${tender?.tenderer ?? "this tender"}?`,
      description:
        "This will permanently remove the tender and its document tasks.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const loadingId = toast.loading("Deleting tender...");
        try {
          await tenderApi.remove(id);
          toast.success("Tender deleted", { id: loadingId });
          await refetch();
        } catch (e) {
          toast.error(
            (e as Error).message || "Failed to delete tender",
            { id: loadingId },
          );
        }
      },
    });
  };

  /* ---------- Edit ---------- */
  const handleEdit = (id: string) => {
    const t = findTenderById(id);
    if (t) setEditTender(t);
  };

  /* ---------- Approve ---------- */
  const handleApproveForParticipation = async (tender: Tender) => {
    try {
      await tenderApi.changeStage(
        tender._id,
        "active",
        "Eligibility approved",
      );
      toast.success(`${tender.tenderer} approved for participation`);
      await refetch();
      setTab("active");
      setSelectedId(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to approve");
    }
  };

  /* ---------- Decline ---------- */
  const handleDecline = (tender: Tender) => {
    toast(`${tender.tenderer} declined — stays in Potential for record`, {
      icon: "ℹ️",
    });
  };

  /* ---------- Eye handler for Potential tab ---------- */
  const handleViewPotential = (id: string) => {
    const t = groups.potential.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <TenderHeader onAddTender={() => setAddOpen(true)} />

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[104px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <TenderStats stats={stats} />
        )}

        <TenderTabs active={tab} counts={counts} onChange={handleTabChange} />

        {loading ? (
          <div className="h-[300px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        ) : (
          <>
            {tab === "potential" && (
              <>
                <TenderTable
                  columns={COLUMNS_POTENTIAL}
                  rows={mapRows("potential", groups.potential)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={handleViewPotential}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailReview
                    key={selected._id}
                    data={toReviewDetail(selected)}
                    onCheckEligibility={() => setEligibilityTender(selected)}
                    onApprove={() =>
                      handleApproveForParticipation(selected)
                    }
                    onOpenChecklist={() => setChecklistTender(selected)}
                    onUploadAttachment={async (file) => {
                      const loadingId = toast.loading(
                        `Uploading ${file.name}...`,
                      );
                      try {
                        await tenderApi.uploadAttachment(
                          selected._id,
                          file,
                        );
                        toast.success("File uploaded", { id: loadingId });
                        refetch();
                      } catch (e) {
                        toast.error(
                          (e as Error).message || "Upload failed",
                          { id: loadingId },
                        );
                        throw e;
                      }
                    }}
                    onDeleteAttachment={async (attachmentId) => {
                      try {
                        await tenderApi.deleteAttachment(
                          selected._id,
                          attachmentId,
                        );
                        toast.success("Attachment removed");
                        refetch();
                      } catch (e) {
                        toast.error(
                          (e as Error).message || "Delete failed",
                        );
                        throw e;
                      }
                    }}
                    /* ---------- NEW ---------- */
                    onUploadAdvertisement={async (file) => {
                      const loadingId = toast.loading(
                        `Uploading ${file.name}...`,
                      );
                      try {
                        await tenderApi.uploadAdvertisement(
                          selected._id,
                          file,
                        );
                        toast.success("Advertisement uploaded", {
                          id: loadingId,
                        });
                        refetch();
                      } catch (e) {
                        toast.error(
                          (e as Error).message || "Upload failed",
                          { id: loadingId },
                        );
                        throw e;
                      }
                    }}
                  />
                )}
              </>
            )}

            {tab === "active" && (
              <>
                <TenderTable
                  columns={COLUMNS_ACTIVE}
                  rows={mapRows("active", groups.active)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={setSelectedId}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailActive
                    key={selected._id}
                    data={toActiveDetail(selected)}
                  />
                )}
              </>
            )}

            {tab === "submitted" && (
              <>
                <TenderTable
                  columns={COLUMNS_SUBMITTED}
                  rows={mapRows("submitted", groups.submitted)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={setSelectedId}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailSubmitted
                    key={selected._id}
                    data={toSubmittedDetail(selected)}
                  />
                )}
              </>
            )}

            {tab === "lost" && (
              <>
                <TenderTable
                  columns={COLUMNS_LOST}
                  rows={mapRows("lost", groups.lost)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={setSelectedId}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailLost
                    key={selected._id}
                    data={toLostDetail(selected)}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ---------- Add Tender ---------- */}
      <AddTenderModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          refetch();
        }}
      />

      {/* ---------- Edit Tender ---------- */}
      <EditTenderModal
        open={!!editTender}
        onOpenChange={(o) => !o && setEditTender(null)}
        tender={editTender}
        onUpdated={() => {
          refetch();
        }}
      />

      {/* ---------- Eligibility Check ---------- */}
      <EligibilityCheckModal
        open={!!eligibilityTender}
        onOpenChange={(o) => !o && setEligibilityTender(null)}
        tender={eligibilityTender}
        onApprove={() => {
          if (eligibilityTender) {
            handleApproveForParticipation(eligibilityTender);
          }
        }}
        onDecline={() => {
          if (eligibilityTender) {
            handleDecline(eligibilityTender);
          }
        }}
      />

      {/* ---------- Submission Checklist ---------- */}
      <SubmissionChecklistModal
        open={!!checklistTender}
        onOpenChange={(o) => !o && setChecklistTender(null)}
        tenderLabel={
          checklistTender
            ? `${checklistTender.tenderer} — ${checklistTender.title}`
            : ""
        }
        initialItems={(checklistTender as any)?.checklist ?? undefined}
        onSave={async (items) => {
          if (!checklistTender) return;
          try {
            await tenderApi.updateChecklist(checklistTender._id, items);
            toast.success("Checklist saved");
            refetch();
          } catch (e) {
            toast.error(
              (e as Error).message || "Failed to save checklist",
            );
            throw e;
          }
        }}
      />
    </main>
  );
}