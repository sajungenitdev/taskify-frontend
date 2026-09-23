// // app/(dashboard)/tenders/manage/page.tsx
// "use client";

// import { Suspense, useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import toast from "react-hot-toast";
// import { FileEdit, X } from "lucide-react";
// import { TenderHeader } from "@/components/tender/TenderHeader";
// import { TenderStats } from "@/components/tender/TenderStats";
// import { TenderTabs, type TenderTab } from "@/components/tender/TenderTabs";
// import {
//   TenderTable,
//   TenderTypeBadge,
//   DocsStatusBadge,
//   DeadlineCell,
// } from "@/components/tender/TenderTable";
// import { TenderDetailReview } from "@/components/tender/TenderDetailReview";
// import { TenderDetailActive } from "@/components/tender/TenderDetailActive";
// import { TenderDetailSubmitted } from "@/components/tender/TenderDetailSubmitted";
// import { TenderDetailLost } from "@/components/tender/TenderDetailLost";
// import { AddTenderModal } from "@/components/tender/modal/AddTenderModal";
// import { EditTenderModal } from "@/components/tender/modal/EditTenderModal";
// import { EligibilityCheckModal } from "@/components/tender/documents/modal/EligibilityCheckModal";
// import { SubmissionChecklistModal } from "@/components/tender/modal/SubmissionChecklistModal";
// import { useTenderStats } from "@/hooks/tender/useTenders";
// import {
//   toReviewDetail,
//   toActiveDetail,
//   toSubmittedDetail,
//   toLostDetail,
// } from "@/lib/api/tender.mapper";
// import type { Tender } from "@/lib/api/tender.api";
// import { tenderApi } from "@/lib/api/tender.api";
// import { confirmToast } from "@/lib/confirmToast";

// /* ---------- Column schemas ---------- */
// const COLUMNS_POTENTIAL = [
//   { key: "tenderer", label: "Tenderer", width: "20%" },
//   { key: "description", label: "Description", width: "34%" },
//   { key: "type", label: "Type", width: "10%" },
//   { key: "recorded", label: "Recorded", width: "14%" },
//   { key: "budget", label: "Tentative Budget", width: "16%" },
// ];

// const COLUMNS_ACTIVE = [
//   { key: "tenderer", label: "Tenderer", width: "32%" },
//   { key: "type", label: "Type", width: "10%" },
//   { key: "deadline", label: "Deadline", width: "14%" },
//   { key: "value", label: "Value", width: "16%" },
//   { key: "status", label: "Docs Status", width: "14%" },
// ];

// const COLUMNS_SUBMITTED = [
//   { key: "tenderer", label: "Tenderer", width: "20%" },
//   { key: "description", label: "Description", width: "40%" },
//   { key: "submitted", label: "Submitted", width: "15%" },
//   { key: "awaiting", label: "Awaiting Result Since", width: "20%" },
// ];

// const COLUMNS_LOST = [
//   { key: "tenderer", label: "Tenderer", width: "18%" },
//   { key: "description", label: "Description", width: "30%" },
//   { key: "reason", label: "Loss Reason", width: "32%" },
//   { key: "date", label: "Date", width: "12%" },
// ];

// const COLUMNS_WON = [
//   { key: "tenderer", label: "Tenderer", width: "22%" },
//   { key: "description", label: "Description", width: "38%" },
//   { key: "bidValue", label: "Winning Bid", width: "18%" },
//   { key: "date", label: "Awarded On", width: "18%" },
// ];

// const COLUMNS_DRAFTS = [
//   { key: "tenderer", label: "Tenderer", width: "24%" },
//   { key: "description", label: "Description", width: "40%" },
//   { key: "type", label: "Type", width: "12%" },
//   { key: "recorded", label: "Created", width: "20%" },
// ];

// /* ---------- Helpers ---------- */
// function fmtDate(d?: string) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function daysLeft(d?: string) {
//   if (!d) return 0;
//   return Math.max(
//     0,
//     Math.ceil((new Date(d).getTime() - Date.now()) / 86400000),
//   );
// }

// function budgetLabel(n?: number) {
//   if (!n) return "—";
//   return `৳${n.toLocaleString("en-IN")}`;
// }

// function mapRows(
//   stage: "potential" | "active" | "submitted" | "lost" | "won" | "drafts",
//   tenders: Tender[],
// ) {
//   return tenders.map((t) => {
//     if (stage === "potential") {
//       return {
//         id: t._id,
//         cells: {
//           tenderer: t.tenderer,
//           description: t.title,
//           type: <TenderTypeBadge type={t.tenderType} />,
//           recorded: fmtDate(t.createdAt),
//           budget: budgetLabel(t.tentativeBudget),
//         },
//       };
//     }
//     if (stage === "active") {
//       return {
//         id: t._id,
//         cells: {
//           tenderer: t.tenderer,
//           type: <TenderTypeBadge type={t.tenderType} />,
//           deadline: <DeadlineCell days={daysLeft(t.lastDateOfSubmission)} />,
//           value: t.tentativeBudget ? budgetLabel(t.tentativeBudget) : "—",
//           status: <DocsStatusBadge status={t.docStatus} />,
//         },
//       };
//     }
//     if (stage === "submitted") {
//       return {
//         id: t._id,
//         cells: {
//           tenderer: t.tenderer,
//           description: t.title,
//           submitted: fmtDate(t.submittedAt ?? t.updatedAt),
//           awaiting: `${daysLeft(t.submittedAt)} days`,
//         },
//       };
//     }
//     if (stage === "won") {
//       return {
//         id: t._id,
//         cells: {
//           tenderer: t.tenderer,
//           description: t.title,
//           bidValue: t.bidValue ? budgetLabel(t.bidValue) : "—",
//           date: fmtDate(t.updatedAt),
//         },
//       };
//     }
//     if (stage === "drafts") {
//       return {
//         id: t._id,
//         cells: {
//           tenderer: t.tenderer,
//           description: t.title,
//           type: <TenderTypeBadge type={t.tenderType} />,
//           recorded: fmtDate(t.createdAt),
//         },
//       };
//     }
//     // lost
//     return {
//       id: t._id,
//       cells: {
//         tenderer: t.tenderer,
//         description: t.title,
//         reason: t.lossReason || "—",
//         date: fmtDate(t.lostAt ?? t.updatedAt),
//       },
//     };
//   });
// }

// /* ---------- Page ---------- */
// export default function TenderManagePage() {
//   return (
//     <Suspense fallback={null}>
//       <TenderManageContent />
//     </Suspense>
//   );
// }

// function TenderManageContent() {
//   const { groups, stats, loading, refetch } = useTenderStats();
//   const [tab, setTab] = useState<TenderTab>("potential");
//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [addOpen, setAddOpen] = useState(false);
//   const [editTender, setEditTender] = useState<Tender | null>(null);
//   const [eligibilityTender, setEligibilityTender] = useState<Tender | null>(
//     null,
//   );
//   const [checklistTender, setChecklistTender] = useState<Tender | null>(
//     null,
//   );

//   /* ---------- Lost-reason prompt (replaces window.prompt) ---------- */
//   const [lostPrompt, setLostPrompt] = useState<{
//     tender: Tender;
//     reason: string;
//   } | null>(null);

//   const router = useRouter();
//   const searchParams = useSearchParams();

//   /* Honor ?tab= from URL */
//   useEffect(() => {
//     const t = searchParams.get("tab");
//     if (
//       t === "potential" ||
//       t === "active" ||
//       t === "submitted" ||
//       t === "lost" ||
//       t === "won" ||
//       t === "drafts"
//     ) {
//       setTab(t as TenderTab);
//       setSelectedId(null);
//     }
//   }, [searchParams]);

//   /* Esc closes the lost-reason modal */
//   useEffect(() => {
//     if (!lostPrompt) return;
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setLostPrompt(null);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [lostPrompt]);

//   const currentRows = groups[tab] ?? [];
//   const selected =
//     currentRows.find((t) => t._id === selectedId) ?? currentRows[0] ?? null;

//   const counts = useMemo(
//     () => ({
//       potential: groups.potential.length,
//       active: groups.active.length,
//       submitted: groups.submitted.length,
//       lost: groups.lost.length,
//       won: groups.won.length,
//       drafts: groups.drafts.length,
//     }),
//     [groups],
//   );

//   const handleTabChange = (next: TenderTab) => {
//     setTab(next);
//     setSelectedId(null);
//   };

//   const handleSubmitTender = async (tender: Tender) => {
//     try {
//       await tenderApi.update(tender._id, {
//         docStatus: "Docs in progress",
//       });
//       toast.success(
//         `${tender.tenderer} queued for submission — review on the Submissions page`,
//       );
//       await refetch();
//       router.push("/tenders/submissions");
//     } catch (e) {
//       toast.error((e as Error).message || "Failed to queue");
//     }
//   };

//   const handleMarkWon = async (tender: Tender) => {
//     try {
//       await tenderApi.changeStage(tender._id, "won", "Client awarded");
//       toast.success(`${tender.tenderer} marked as WON`);
//       await refetch();
//       setTab("won");
//       setSelectedId(null);
//     } catch (e) {
//       toast.error((e as Error).message || "Failed to update");
//     }
//   };

//   /* ---------- Mark as Lost — opens custom modal ---------- */
//   const handleMarkLost = (tender: Tender) => {
//     setLostPrompt({ tender, reason: "" });
//   };

//   /* ---------- Confirm inside the modal ---------- */
//   const confirmMarkLost = async () => {
//     if (!lostPrompt) return;
//     const { tender, reason } = lostPrompt;
//     try {
//       await tenderApi.changeStage(
//         tender._id,
//         "lost",
//         "Lost to competitor",
//         reason.trim() || "Not specified",
//       );
//       toast.success(`${tender.tenderer} marked as LOST`);
//       setLostPrompt(null);
//       await refetch();
//       setTab("lost");
//       setSelectedId(null);
//     } catch (e) {
//       toast.error((e as Error).message || "Failed to update");
//     }
//   };

//   const findTenderById = (id: string): Tender | undefined =>
//     Object.values(groups)
//       .flat()
//       .find((x) => x._id === id);

//   const handleDelete = (id: string) => {
//     const tender = findTenderById(id);
//     confirmToast({
//       title: `Delete ${tender?.tenderer ?? "this tender"}?`,
//       description:
//         "This will permanently remove the tender and its document tasks.",
//       confirmLabel: "Delete",
//       variant: "danger",
//       onConfirm: async () => {
//         const loadingId = toast.loading("Deleting tender...");
//         try {
//           await tenderApi.remove(id);
//           toast.success("Tender deleted", { id: loadingId });
//           await refetch();
//         } catch (e) {
//           toast.error(
//             (e as Error).message || "Failed to delete tender",
//             { id: loadingId },
//           );
//         }
//       },
//     });
//   };

//   const handleEdit = (id: string) => {
//     const t = findTenderById(id);
//     if (t) setEditTender(t);
//   };

//   /* ---------- Publish a draft ---------- */
//   const handlePublishDraft = async (tender: Tender) => {
//     confirmToast({
//       title: `Publish "${tender.tenderer}"?`,
//       description:
//         "This will move the tender out of Drafts and into the Potential tab.",
//       confirmLabel: "Publish",
//       variant: "default",
//       onConfirm: async () => {
//         const loadingId = toast.loading("Publishing draft...");
//         try {
//           await tenderApi.update(tender._id, { draft: false });
//           toast.success("Draft published to Potential", { id: loadingId });
//           await refetch();
//           setTab("potential");
//           setSelectedId(null);
//         } catch (e) {
//           toast.error(
//             (e as Error).message || "Failed to publish",
//             { id: loadingId },
//           );
//         }
//       },
//     });
//   };

//   const handleApproveForParticipation = async (tender: Tender) => {
//     try {
//       await tenderApi.changeStage(
//         tender._id,
//         "active",
//         "Eligibility approved",
//       );
//       toast.success(`${tender.tenderer} approved for participation`);
//       await refetch();
//       setTab("active");
//       setSelectedId(null);
//     } catch (e) {
//       toast.error((e as Error).message || "Failed to approve");
//     }
//   };

//   const handleDecline = (tender: Tender) => {
//     toast(`${tender.tenderer} declined — stays in Potential for record`, {
//       icon: "ℹ️",
//     });
//   };

//   /* ---------- Eye handlers (open checklist modal) ---------- */
//   const handleViewPotential = (id: string) => {
//     const t = groups.potential.find((x) => x._id === id);
//     if (t) setChecklistTender(t);
//   };
//   const handleViewActive = (id: string) => {
//     const t = groups.active.find((x) => x._id === id);
//     if (t) setChecklistTender(t);
//   };
//   const handleViewSubmitted = (id: string) => {
//     const t = groups.submitted.find((x) => x._id === id);
//     if (t) setChecklistTender(t);
//   };
//   const handleViewLost = (id: string) => {
//     const t = groups.lost.find((x) => x._id === id);
//     if (t) setChecklistTender(t);
//   };
//   const handleViewWon = (id: string) => {
//     const t = groups.won.find((x) => x._id === id);
//     if (t) setChecklistTender(t);
//   };
//   const handleViewDraft = (id: string) => {
//     const t = groups.drafts.find((x) => x._id === id);
//     if (t) setEditTender(t);
//   };

//   return (
//     <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
//       <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
//         <TenderHeader onAddTender={() => setAddOpen(true)} />

//         {loading ? (
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//             {Array.from({ length: 5 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="h-[104px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
//               />
//             ))}
//           </div>
//         ) : (
//           <TenderStats stats={stats} />
//         )}

//         <TenderTabs active={tab} counts={counts} onChange={handleTabChange} />

//         {loading ? (
//           <div className="h-[300px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
//         ) : (
//           <>
//             {/* ================= POTENTIAL ================= */}
//             {tab === "potential" && (
//               <>
//                 <TenderTable
//                   columns={COLUMNS_POTENTIAL}
//                   rows={mapRows("potential", groups.potential)}
//                   selectedId={selected?._id ?? null}
//                   onRowClick={setSelectedId}
//                   onDelete={handleDelete}
//                   onView={handleViewPotential}
//                   onEdit={handleEdit}
//                 />
//                 {selected && (
//                   <TenderDetailReview
//                     key={selected._id}
//                     data={toReviewDetail(selected)}
//                     onCheckEligibility={() => setEligibilityTender(selected)}
//                     onApprove={() =>
//                       handleApproveForParticipation(selected)
//                     }
//                     onOpenChecklist={() => setChecklistTender(selected)}
//                     onUploadAttachment={async (file) => {
//                       const loadingId = toast.loading(
//                         `Uploading ${file.name}...`,
//                       );
//                       try {
//                         await tenderApi.uploadAttachment(
//                           selected._id,
//                           file,
//                         );
//                         toast.success("File uploaded", { id: loadingId });
//                         refetch();
//                       } catch (e) {
//                         toast.error(
//                           (e as Error).message || "Upload failed",
//                           { id: loadingId },
//                         );
//                         throw e;
//                       }
//                     }}
//                     onDeleteAttachment={async (attachmentId) => {
//                       try {
//                         await tenderApi.deleteAttachment(
//                           selected._id,
//                           attachmentId,
//                         );
//                         toast.success("Attachment removed");
//                         refetch();
//                       } catch (e) {
//                         toast.error(
//                           (e as Error).message || "Delete failed",
//                         );
//                         throw e;
//                       }
//                     }}
//                     onUploadAdvertisement={async (file) => {
//                       const loadingId = toast.loading(
//                         `Uploading ${file.name}...`,
//                       );
//                       try {
//                         await tenderApi.uploadAdvertisement(
//                           selected._id,
//                           file,
//                         );
//                         toast.success("Advertisement uploaded", {
//                           id: loadingId,
//                         });
//                         refetch();
//                       } catch (e) {
//                         toast.error(
//                           (e as Error).message || "Upload failed",
//                           { id: loadingId },
//                         );
//                         throw e;
//                       }
//                     }}
//                   />
//                 )}
//               </>
//             )}

//             {/* ================= ACTIVE ================= */}
//             {tab === "active" && (
//               <>
//                 <TenderTable
//                   columns={COLUMNS_ACTIVE}
//                   rows={mapRows("active", groups.active)}
//                   selectedId={selected?._id ?? null}
//                   onRowClick={setSelectedId}
//                   onDelete={handleDelete}
//                   onView={handleViewActive}
//                   onEdit={handleEdit}
//                 />
//                 {selected && (
//                   <TenderDetailActive
//                     key={selected._id}
//                     data={toActiveDetail(selected)}
//                     onSubmit={() => handleSubmitTender(selected)}
//                   />
//                 )}
//               </>
//             )}

//             {/* ================= SUBMITTED ================= */}
//             {tab === "submitted" && (
//               <>
//                 <TenderTable
//                   columns={COLUMNS_SUBMITTED}
//                   rows={mapRows("submitted", groups.submitted)}
//                   selectedId={selected?._id ?? null}
//                   onRowClick={setSelectedId}
//                   onDelete={handleDelete}
//                   onView={handleViewSubmitted}
//                   onEdit={handleEdit}
//                 />
//                 {selected && (
//                   <TenderDetailSubmitted
//                     key={selected._id}
//                     data={toSubmittedDetail(selected)}
//                     onMarkWon={() => handleMarkWon(selected)}
//                     onMarkLost={() => handleMarkLost(selected)}
//                   />
//                 )}
//               </>
//             )}

//             {/* ================= LOST ================= */}
//             {tab === "lost" && (
//               <>
//                 <TenderTable
//                   columns={COLUMNS_LOST}
//                   rows={mapRows("lost", groups.lost)}
//                   selectedId={selected?._id ?? null}
//                   onRowClick={setSelectedId}
//                   onDelete={handleDelete}
//                   onView={handleViewLost}
//                   onEdit={handleEdit}
//                 />
//                 {selected && (
//                   <TenderDetailLost
//                     key={selected._id}
//                     data={toLostDetail(selected)}
//                   />
//                 )}
//               </>
//             )}

//             {/* ================= WON ================= */}
//             {tab === "won" && (
//               <>
//                 <TenderTable
//                   columns={COLUMNS_WON}
//                   rows={mapRows("won", groups.won)}
//                   selectedId={selected?._id ?? null}
//                   onRowClick={setSelectedId}
//                   onDelete={handleDelete}
//                   onView={handleViewWon}
//                 />
//                 {selected && (
//                   <TenderDetailSubmitted
//                     key={selected._id}
//                     data={toSubmittedDetail(selected)}
//                   />
//                 )}
//               </>
//             )}

//             {/* ================= DRAFTS ================= */}
//             {tab === "drafts" && (
//               <>
//                 {groups.drafts.length === 0 ? (
//                   <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
//                     <FileEdit className="mx-auto mb-3 h-6 w-6 text-slate-300" />
//                     <p className="text-sm font-semibold text-slate-600">
//                       No drafts saved.
//                     </p>
//                     <p className="mt-1 text-[11px] text-slate-400">
//                       Click <strong>+ Add Tender</strong> and choose{" "}
//                       <strong>Save as Draft</strong> to start one.
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <TenderTable
//                       columns={COLUMNS_DRAFTS}
//                       rows={mapRows("drafts", groups.drafts)}
//                       selectedId={selected?._id ?? null}
//                       onRowClick={setSelectedId}
//                       onDelete={handleDelete}
//                       onView={handleViewDraft}
//                       onEdit={handleEdit}
//                     />
//                     {selected && (
//                       <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-5">
//                         <div className="flex flex-wrap items-center justify-between gap-3">
//                           <div className="min-w-0">
//                             <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
//                               Draft
//                             </p>
//                             <h3 className="mt-1 text-sm font-bold text-slate-900">
//                               {selected.tenderer} — {selected.title}
//                             </h3>
//                             <p className="mt-0.5 text-[11px] text-slate-500">
//                               This tender was saved as a draft. Fill in the
//                               missing details and publish it when ready.
//                             </p>
//                           </div>
//                           <div className="flex shrink-0 items-center gap-2">
//                             <button
//                               type="button"
//                               onClick={() => setEditTender(selected)}
//                               className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                             >
//                               Complete Draft
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => handlePublishDraft(selected)}
//                               className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
//                             >
//                               Publish to Potential
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </>
//             )}
//           </>
//         )}
//       </div>

//       {/* ================= Lost Reason Modal ================= */}
//       {lostPrompt && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//           <div
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm"
//             onClick={() => setLostPrompt(null)}
//           />
//           <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
//             {/* Header */}
//             <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
//               <div className="min-w-0">
//                 <h3 className="text-sm font-bold text-slate-900">
//                   Why was "{lostPrompt.tender.tenderer}" lost?
//                 </h3>
//                 <p className="mt-0.5 text-[11px] text-slate-500">
//                   Optional. Click Mark as Lost to confirm.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setLostPrompt(null)}
//                 className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
//                 aria-label="Close"
//               >
//                 <X className="h-3.5 w-3.5" />
//               </button>
//             </div>

//             {/* Body */}
//             <div className="px-5 py-4">
//               <textarea
//                 autoFocus
//                 rows={3}
//                 value={lostPrompt.reason}
//                 onChange={(e) =>
//                   setLostPrompt({
//                     ...lostPrompt,
//                     reason: e.target.value,
//                   })
//                 }
//                 placeholder="e.g. Lost to competitor on price"
//                 className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//               />
//             </div>

//             {/* Footer */}
//             <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
//               <button
//                 type="button"
//                 onClick={() => setLostPrompt(null)}
//                 className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={confirmMarkLost}
//                 className="inline-flex h-8 items-center rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
//               >
//                 Mark as Lost
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <AddTenderModal
//         open={addOpen}
//         onOpenChange={setAddOpen}
//         onCreated={() => {
//           refetch();
//         }}
//       />

//       <EditTenderModal
//         open={!!editTender}
//         onOpenChange={(o) => !o && setEditTender(null)}
//         tender={editTender}
//         onUpdated={() => {
//           refetch();
//         }}
//       />

//       <EligibilityCheckModal
//         open={!!eligibilityTender}
//         onOpenChange={(o) => !o && setEligibilityTender(null)}
//         tender={eligibilityTender}
//         onApprove={() => {
//           if (eligibilityTender) {
//             handleApproveForParticipation(eligibilityTender);
//           }
//         }}
//         onDecline={() => {
//           if (eligibilityTender) {
//             handleDecline(eligibilityTender);
//           }
//         }}
//       />

//       <SubmissionChecklistModal
//         key={checklistTender?._id ?? "none"}
//         open={!!checklistTender}
//         onOpenChange={(o) => !o && setChecklistTender(null)}
//         tenderLabel={
//           checklistTender
//             ? `${checklistTender.tenderer} — ${checklistTender.title}`
//             : ""
//         }
//         initialItems={(checklistTender as any)?.checklist ?? undefined}
//         onSave={async (items) => {
//           if (!checklistTender) return;
//           try {
//             await tenderApi.updateChecklist(checklistTender._id, items);
//             toast.success("Checklist saved");
//             refetch();
//           } catch (e) {
//             toast.error(
//               (e as Error).message || "Failed to save checklist",
//             );
//             throw e;
//           }
//         }}
//       />
//     </main>
//   );
// }


// app/(dashboard)/tenders/manage/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FileEdit, X } from "lucide-react";
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
import SiteDirectory from "@/components/tender/site-directory/SiteDirectory";

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

const COLUMNS_WON = [
  { key: "tenderer", label: "Tenderer", width: "22%" },
  { key: "description", label: "Description", width: "38%" },
  { key: "bidValue", label: "Winning Bid", width: "18%" },
  { key: "date", label: "Awarded On", width: "18%" },
];

const COLUMNS_DRAFTS = [
  { key: "tenderer", label: "Tenderer", width: "24%" },
  { key: "description", label: "Description", width: "40%" },
  { key: "type", label: "Type", width: "12%" },
  { key: "recorded", label: "Created", width: "20%" },
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
  stage: "potential" | "active" | "submitted" | "lost" | "won" | "drafts",
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
          status: <DocsStatusBadge status={t.docStatus} />,
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
    if (stage === "won") {
      return {
        id: t._id,
        cells: {
          tenderer: t.tenderer,
          description: t.title,
          bidValue: t.bidValue ? budgetLabel(t.bidValue) : "—",
          date: fmtDate(t.updatedAt),
        },
      };
    }
    if (stage === "drafts") {
      return {
        id: t._id,
        cells: {
          tenderer: t.tenderer,
          description: t.title,
          type: <TenderTypeBadge type={t.tenderType} />,
          recorded: fmtDate(t.createdAt),
        },
      };
    }
    // lost
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

/* ---------- Page (no Suspense wrapper — prevents remounts) ---------- */
export default function TenderManagePage() {
  return <TenderManageContent />;
}

function TenderManageContent() {
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

  /* ---------- Lost-reason prompt ---------- */
  const [lostPrompt, setLostPrompt] = useState<{
    tender: Tender;
    reason: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const didInitTab = useRef(false);

  /* Read ?tab= ONCE on mount. Never re-apply on subsequent renders. */
  useEffect(() => {
    if (didInitTab.current) return;
    didInitTab.current = true;
    const t = searchParams.get("tab");
    if (
      t === "potential" ||
      t === "active" ||
      t === "submitted" ||
      t === "lost" ||
      t === "won" ||
      t === "drafts"
    ) {
      setTab(t as TenderTab);
    }
  }, [searchParams]);

  /* Esc closes the lost-reason modal */
  useEffect(() => {
    if (!lostPrompt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLostPrompt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lostPrompt]);

  const currentRows = groups[tab] ?? [];
  const selected =
    currentRows.find((t) => t._id === selectedId) ?? currentRows[0] ?? null;

  const counts = useMemo(
    () => ({
      potential: groups.potential.length,
      active: groups.active.length,
      submitted: groups.submitted.length,
      lost: groups.lost.length,
      won: groups.won.length,
      drafts: groups.drafts.length,
    }),
    [groups],
  );

  const handleTabChange = (next: TenderTab) => {
    setTab(next);
    setSelectedId(null);
  };

  const handleSubmitTender = async (tender: Tender) => {
    try {
      await tenderApi.update(tender._id, {
        docStatus: "Docs in progress",
      });
      toast.success(
        `${tender.tenderer} queued for submission — review on the Submissions page`,
      );
      await refetch();
      router.push("/tenders/submissions");
    } catch (e) {
      toast.error((e as Error).message || "Failed to queue");
    }
  };

  const handleMarkWon = async (tender: Tender) => {
    try {
      await tenderApi.changeStage(tender._id, "won", "Client awarded");
      toast.success(`${tender.tenderer} marked as WON`);
      await refetch();
      setTab("won");
      setSelectedId(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to update");
    }
  };

  const handleMarkLost = (tender: Tender) => {
    setLostPrompt({ tender, reason: "" });
  };

  const confirmMarkLost = async () => {
    if (!lostPrompt) return;
    const { tender, reason } = lostPrompt;
    try {
      await tenderApi.changeStage(
        tender._id,
        "lost",
        "Lost to competitor",
        reason.trim() || "Not specified",
      );
      toast.success(`${tender.tenderer} marked as LOST`);
      setLostPrompt(null);
      await refetch();
      setTab("lost");
      setSelectedId(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to update");
    }
  };

  const findTenderById = (id: string): Tender | undefined =>
    Object.values(groups)
      .flat()
      .find((x) => x._id === id);

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

  const handleEdit = (id: string) => {
    const t = findTenderById(id);
    if (t) setEditTender(t);
  };

  const handlePublishDraft = async (tender: Tender) => {
    confirmToast({
      title: `Publish "${tender.tenderer}"?`,
      description:
        "This will move the tender out of Drafts and into the Potential tab.",
      confirmLabel: "Publish",
      variant: "default",
      onConfirm: async () => {
        const loadingId = toast.loading("Publishing draft...");
        try {
          await tenderApi.update(tender._id, { draft: false });
          toast.success("Draft published to Potential", { id: loadingId });
          await refetch();
          setTab("potential");
          setSelectedId(null);
        } catch (e) {
          toast.error(
            (e as Error).message || "Failed to publish",
            { id: loadingId },
          );
        }
      },
    });
  };

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

  const handleDecline = (tender: Tender) => {
    toast(`${tender.tenderer} declined — stays in Potential for record`, {
      icon: "ℹ️",
    });
  };

  const handleViewPotential = (id: string) => {
    const t = groups.potential.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };
  const handleViewActive = (id: string) => {
    const t = groups.active.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };
  const handleViewSubmitted = (id: string) => {
    const t = groups.submitted.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };
  const handleViewLost = (id: string) => {
    const t = groups.lost.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };
  const handleViewWon = (id: string) => {
    const t = groups.won.find((x) => x._id === id);
    if (t) setChecklistTender(t);
  };
  const handleViewDraft = (id: string) => {
    const t = groups.drafts.find((x) => x._id === id);
    if (t) setEditTender(t);
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
            {/* ================= POTENTIAL ================= */}
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

            {/* ================= ACTIVE ================= */}
            {tab === "active" && (
              <>
                <TenderTable
                  columns={COLUMNS_ACTIVE}
                  rows={mapRows("active", groups.active)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={handleViewActive}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailActive
                    key={selected._id}
                    data={toActiveDetail(selected)}
                    onSubmit={() => handleSubmitTender(selected)}
                  />
                )}
              </>
            )}

            {/* ================= SUBMITTED ================= */}
            {tab === "submitted" && (
              <>
                <TenderTable
                  columns={COLUMNS_SUBMITTED}
                  rows={mapRows("submitted", groups.submitted)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={handleViewSubmitted}
                  onEdit={handleEdit}
                />
                {selected && (
                  <TenderDetailSubmitted
                    key={selected._id}
                    data={toSubmittedDetail(selected)}
                    onMarkWon={() => handleMarkWon(selected)}
                    onMarkLost={() => handleMarkLost(selected)}
                  />
                )}
              </>
            )}

            {/* ================= LOST ================= */}
            {tab === "lost" && (
              <>
                <TenderTable
                  columns={COLUMNS_LOST}
                  rows={mapRows("lost", groups.lost)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={handleViewLost}
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

            {/* ================= WON ================= */}
            {tab === "won" && (
              <>
                <TenderTable
                  columns={COLUMNS_WON}
                  rows={mapRows("won", groups.won)}
                  selectedId={selected?._id ?? null}
                  onRowClick={setSelectedId}
                  onDelete={handleDelete}
                  onView={handleViewWon}
                />
                {selected && (
                  <TenderDetailSubmitted
                    key={selected._id}
                    data={toSubmittedDetail(selected)}
                  />
                )}
              </>
            )}

            {/* ================= DRAFTS ================= */}
            {tab === "drafts" && (
              <>
                {groups.drafts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <FileEdit className="mx-auto mb-3 h-6 w-6 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">
                      No drafts saved.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Click <strong>+ Add Tender</strong> and choose{" "}
                      <strong>Save as Draft</strong> to start one.
                    </p>
                  </div>
                ) : (
                  <>
                    <TenderTable
                      columns={COLUMNS_DRAFTS}
                      rows={mapRows("drafts", groups.drafts)}
                      selectedId={selected?._id ?? null}
                      onRowClick={setSelectedId}
                      onDelete={handleDelete}
                      onView={handleViewDraft}
                      onEdit={handleEdit}
                    />
                    {selected && (
                      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Draft
                            </p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">
                              {selected.tenderer} — {selected.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              This tender was saved as a draft. Fill in the
                              missing details and publish it when ready.
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditTender(selected)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Complete Draft
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePublishDraft(selected)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                            >
                              Publish to Potential
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {tab === "site-directory" && <SiteDirectory />}
          </>
        )}
      </div>

      {/* ================= Lost Reason Modal ================= */}
      {lostPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setLostPrompt(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  Why was "{lostPrompt.tender.tenderer}" lost?
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Optional. Click Mark as Lost to confirm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLostPrompt(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <textarea
                autoFocus
                rows={3}
                value={lostPrompt.reason}
                onChange={(e) =>
                  setLostPrompt({
                    ...lostPrompt,
                    reason: e.target.value,
                  })
                }
                placeholder="e.g. Lost to competitor on price"
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={() => setLostPrompt(null)}
                className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkLost}
                className="inline-flex h-8 items-center rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTenderModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          refetch();
        }}
      />

      <EditTenderModal
        open={!!editTender}
        onOpenChange={(o) => !o && setEditTender(null)}
        tender={editTender}
        onUpdated={() => {
          refetch();
        }}
      />

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

      <SubmissionChecklistModal
        key={checklistTender?._id ?? "none"}
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