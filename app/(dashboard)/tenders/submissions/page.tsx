// app/(dashboard)/tenders/submissions/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { SubmissionHeader } from "@/components/tender/submission/SubmissionHeader";
import { SubmissionTable } from "@/components/tender/submission/SubmissionTable";
import { SubmissionDetail } from "@/components/tender/submission/SubmissionDetail";
import {
    useSubmissions,
    useSubmissionDetail,
} from "@/hooks/tender/useSubmissions";
import {
    sanitizeSubmissionDetail,
    toSubmissionUIRow,
} from "@/lib/api/tender.mapper";
import { tenderApi } from "@/lib/api/tender.api";
import { confirmToast } from "@/lib/confirmToast";
import { BidderList } from "@/components/tender/BidderList";
import { AddBidderModal, BidderRow } from "@/components/tender/AddBidderModal";
import { SecurityNotifyModal } from "@/components/tender/modal/SecurityNotifyModal";

export default function TenderSubmissionPage() {
    const router = useRouter();
    const { rows, loading: rowsLoading, refetch: refetchRows } = useSubmissions();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [bidderModalOpen, setBidderModalOpen] = useState(false);

    /* ✅ Notify Finance modal state */
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifying, setNotifying] = useState(false);

    /* Auto-select the first row once data arrives */
    useEffect(() => {
        if (!selectedId && rows.length > 0) {
            setSelectedId(rows[0].id);
        }
    }, [rows, selectedId]);

    const {
        data: detail,
        loading: detailLoading,
        refetch: refetchDetail,
    } = useSubmissionDetail(selectedId);

    /* ---------- Delete ---------- */
    const handleDelete = (id: string) => {
        const row = rows.find((r) => r.id === id);
        confirmToast({
            title: `Delete ${row?.tenderer ?? "this submission"}?`,
            description:
                "This will permanently remove the tender and all its document tasks.",
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: async () => {
                const loadingId = toast.loading("Deleting submission...");
                try {
                    await tenderApi.remove(id);
                    toast.success("Submission deleted", { id: loadingId });
                    if (selectedId === id) setSelectedId(null);
                    await refetchRows();
                } catch (e) {
                    toast.error(
                        (e as Error).message || "Failed to delete",
                        { id: loadingId },
                    );
                }
            },
        });
    };

    /* ---------- Bidders ---------- */
    const handleSaveBidders = async (bidders: BidderRow[]) => {
        if (!detail) return;
        const loadingId = toast.loading("Saving bidders...");
        try {
            await tenderApi.update(detail.id, {
                otherParticipants: bidders,
            });
            toast.success("Bidders saved", { id: loadingId });
            await refetchDetail();
        } catch (e) {
            toast.error(
                (e as Error).message || "Failed to save bidders",
                { id: loadingId },
            );
        }
    };

    const handleDeleteAllBidders = () => {
        if (!detail) return;
        confirmToast({
            title: `Clear all bidders?`,
            description:
                "This will remove every recorded bidder for this tender.",
            confirmLabel: "Clear",
            variant: "danger",
            onConfirm: async () => {
                await handleSaveBidders([]);
            },
        });
    };

    /* ---------- Notify Finance — called by the modal ---------- */
    const handleNotifySend = async (emails: string[], note?: string) => {
        if (!detail) return;

        setNotifying(true);
        const loadingId = toast.loading("Notifying finance...");
        try {
            // ✅ Now hits the real backend endpoint with emails + note
            const res = await tenderApi.notifyFinance(detail.id, {
                emails,
                note,
            });
            const sent = res?.sent ?? emails.length;
            const failed = res?.failed ?? 0;

            toast.success(
                failed === 0
                    ? `Finance notified (${sent} recipient${sent === 1 ? "" : "s"})`
                    : `Notified ${sent} (${failed} failed)`,
                { id: loadingId },
            );

            setNotifyOpen(false);
        } catch (e) {
            toast.error(
                (e as Error).message || "Failed to notify finance",
                { id: loadingId },
            );
            // Rethrow so the modal can stay open and show its own error state
            throw e;
        } finally {
            setNotifying(false);
        }
    };

    /* ---------- Final Submit ---------- */
    const handleFinalSubmit = async () => {
        if (!detail) return;
        if (submitting) return;

        const row = rows.find((r) => r.id === detail.id);
        confirmToast({
            title: `Submit ${row?.tenderer ?? "this tender"}?`,
            description:
                "The tender will be marked as Submitted and moved to the Submitted tab. This cannot be undone from here.",
            confirmLabel: "Submit Tender",
            variant: "default",
            onConfirm: async () => {
                setSubmitting(true);
                const loadingId = toast.loading("Submitting tender...");
                try {
                    await tenderApi.changeStage(
                        detail.id,
                        "submitted",
                        "Submitted to client",
                    );
                    toast.success("Tender marked as submitted", {
                        id: loadingId,
                    });
                    await refetchRows();
                    setSelectedId(null);
                    router.push("/tenders/manage?tab=submitted");
                } catch (e) {
                    toast.error(
                        (e as Error).message || "Failed to submit",
                        { id: loadingId },
                    );
                } finally {
                    setSubmitting(false);
                }
            },
        });
    };

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <SubmissionHeader />

                {rowsLoading ? (
                    <div className="h-[260px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                ) : rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                        No submissions yet.
                    </div>
                ) : (
                    <SubmissionTable
                        rows={rows.map(toSubmissionUIRow)}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDelete={handleDelete}
                        onView={setSelectedId}
                    />
                )}

                {detailLoading && (
                    <div className="h-[420px] animate-pulse rounded-xl border border-amber-200 bg-white" />
                )}

                {!detailLoading && detail && (
                    <>
                        <SubmissionDetail
                            data={{
                                ...(() => {
                                    const sanitized =
                                        sanitizeSubmissionDetail(detail);
                                    return {
                                        ...sanitized,
                                        info: {
                                            ...sanitized.info,
                                            attachments:
                                                sanitized.info.attachments?.map(
                                                    (attachment, index) => ({
                                                        ...attachment,
                                                        _id:
                                                            attachment._id ??
                                                            `${detail.id}-attachment-${index}`,
                                                    }),
                                                ),
                                        },
                                    };
                                })(),
                                notifyAction: {
                                    label: "Notify Finance",
                                    // ✅ Just opens the modal — no API call here
                                    onClick: () => setNotifyOpen(true),
                                    loading: notifying,
                                },
                            }}
                            onTaskMutated={() => refetchDetail()}
                            submitAction={{
                                label: "Submit Tender",
                                onClick: handleFinalSubmit,
                                loading: submitting,
                            }}
                        />

                        <BidderList
                            bidders={detail.otherParticipants ?? []}
                            onAdd={() => setBidderModalOpen(true)}
                            onEdit={() => setBidderModalOpen(true)}
                            onDelete={handleDeleteAllBidders}
                        />
                    </>
                )}
            </div>

            {/* ---------- Bidders Modal ---------- */}
            {detail && (
                <AddBidderModal
                    open={bidderModalOpen}
                    onOpenChange={setBidderModalOpen}
                    initial={detail.otherParticipants ?? []}
                    onSave={handleSaveBidders}
                />
            )}

            {/* ---------- Notify Finance Modal ---------- */}
            {detail && (
                <SecurityNotifyModal
                    open={notifyOpen}
                    onOpenChange={setNotifyOpen}
                    entity={detail.tenderer}
                    variant="submission"
                    onSend={handleNotifySend}
                />
            )}
        </main>
    );
}