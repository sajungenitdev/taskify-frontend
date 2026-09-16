// app/(dashboard)/tenders/submissions/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

export default function TenderSubmissionPage() {
    const { rows, loading: rowsLoading, refetch: refetchRows } = useSubmissions();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    /* Auto-select the first row once data arrives */
    useEffect(() => {
        if (!selectedId && rows.length > 0) {
            setSelectedId(rows[0].id);
        }
    }, [rows, selectedId]);

    const { data: detail, loading: detailLoading } =
        useSubmissionDetail(selectedId);

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
                    <SubmissionDetail
                        data={{
                            ...sanitizeSubmissionDetail(detail),
                            notifyAction: {
                                label: "Notify Finance — Banking Docs Pending",
                                onClick: () => {
                                    // TODO: notification endpoint when it exists
                                },
                            },
                        }}
                    />
                )}
            </div>
        </main>
    );
}