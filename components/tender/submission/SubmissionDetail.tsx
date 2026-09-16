// components/tender/submission/SubmissionDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";
import { DocTaskRow, type DocTask } from "./DocTaskRow";
import { SubmissionChecklist } from "./SubmissionChecklist";
import { ReadinessBar } from "./ReadinessBar";
import { docTaskApi, tenderApi } from "@/lib/api/tender.api";
import toast from "react-hot-toast";

export interface SubmissionAttachment {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface SubmissionInfoPayload {
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  tenderLink?: string;
  recordedBy: string;
  tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";
  responsiblePerson: string;
  lastDateOfPurchase?: string;
  lastDateOfSubmission?: string;
  note?: string;
  attachments: SubmissionAttachment[];
  eligibility?: string;
}

export interface SubmissionDetailData {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  docTasks: DocTask[];
  checklist: {
    id: string;
    label: string;
    checked: boolean;
    isCustom?: boolean;
  }[];
  info: SubmissionInfoPayload;
  notifyAction?: { label: string; onClick: () => void };
}

interface Props {
  data: SubmissionDetailData;
  onTaskMutated?: () => void;
}

const TABS = ["Tender Preparation", "Tender Info"] as const;
type Tab = (typeof TABS)[number];

function fullFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function fileSizeLabel(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmissionDetail({ data, onTaskMutated }: Props) {
  const [tab, setTab] = useState<Tab>("Tender Preparation");
  const [showDetails, setShowDetails] = useState(true);
  const [tasks, setTasks] = useState<DocTask[]>(data.docTasks);
  const [checklist, setChecklist] = useState(data.checklist);
  const [uploadingAd, setUploadingAd] = useState(false);

  /* ============================================================
   * DEBUG LOGS — remove after fixing the attachments issue
   * ============================================================ */
  useEffect(() => {
    console.log("%c=== SubmissionDetail received data ===", "background:#000;color:#0ff;padding:2px 6px;font-weight:bold");
    console.log("data.id:", data.id);
    console.log("data.tenderer:", data.tenderer);
    console.log("data.info:", data.info);
    console.log("data.info.attachments:", data.info?.attachments);
    console.log("data.info.attachments.length:", data.info?.attachments?.length);
    console.log("data.info.advertisementFile:", data.info?.advertisementFile);
    console.log("data.info.advertisementUrl:", data.info?.advertisementUrl);
    console.log("data.checklist:", data.checklist);
  }, [data]);
  /* ============================================================ */

  useEffect(() => {
    setTasks(data.docTasks);
    setChecklist(data.checklist);
  }, [data.id, data.docTasks, data.checklist]);

  const addTask = () => {
    const draft: DocTask = {
      id: `draft-${Date.now()}`,
      title: "",
      owner: "",
      fileName: "No file uploaded yet",
      status: "Pending",
      isDraft: true,
    };
    setTasks((prev) => [...prev, draft]);
  };

  const patchTask = (id: string, patch: Partial<DocTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  };

  const saveTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const finalTitle = task.title.trim() || "Untitled task";
    const finalOwner = task.owner.trim() || "—";

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: finalTitle, owner: finalOwner, isDraft: false }
          : t,
      ),
    );

    try {
      const created = await docTaskApi.add(data.id, {
        title: finalTitle,
        owner: finalOwner,
        status: task.status,
        fileName: task.fileName,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, id: created._id, isDraft: false } : t,
        ),
      );
      toast.success("Document task added");
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed to add document task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const cancelTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const removeTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (target?.isDraft) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await docTaskApi.remove(data.id, id);
      toast.success("Document task removed");
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Failed to remove document task");
      setTasks(snapshot);
    }
  };

  const uploadTaskFile = async (taskId: string, file: File) => {
    const loadingId = toast.loading(`Uploading ${file.name}...`);
    try {
      const att = await tenderApi.uploadAttachment(data.id, file);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                fileName: att.name,
                fileUrl: fullFileUrl(att.url),
                status: "Done",
              }
            : t,
        ),
      );
      toast.success("File uploaded", { id: loadingId });
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed", { id: loadingId });
    }
  };

  const toggleChecklist = async (id: string, checked: boolean) => {
    const next = checklist.map((c) =>
      c.id === id ? { ...c, checked } : c,
    );
    const previous = checklist;
    setChecklist(next);
    try {
      await tenderApi.updateChecklist(data.id, next);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save checklist");
      setChecklist(previous);
    }
  };

  const replaceAdvertisement = async (file: File) => {
    setUploadingAd(true);
    const loadingId = toast.loading(`Uploading ${file.name}...`);
    try {
      await tenderApi.uploadAdvertisement(data.id, file);
      toast.success("Advertisement replaced", { id: loadingId });
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed", { id: loadingId });
    } finally {
      setUploadingAd(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-amber-100 px-5 py-4">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
            {data.deadlineDays} days to deadline
          </span>
          <h2 className="mt-1.5 text-base font-bold text-slate-900">
            {data.tenderer} — {data.title}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Submission Readiness
            </span>
            <ReadinessBar percent={data.readiness} width={140} />
          </div>
        </div>

        {/* {data.notifyAction && (
          <button
            type="button"
            onClick={data.notifyAction.onClick}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {data.notifyAction.label}
          </button>
        )} */}
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 px-5">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative inline-flex items-center px-3 py-2.5 text-[12px] font-semibold transition-colors ${
                  active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
                )}
              </button>
            );
          })}
        </div>

        {tab === "Tender Preparation" && (
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            {showDetails
              ? "− Hide Preparation Details"
              : "+ Show Preparation Details"}
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {tab === "Tender Preparation" && showDetails && (
        <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Document Tasks
            </p>

            <div>
              {tasks.map((task) => (
                <DocTaskRow
                  key={task.id}
                  task={task}
                  onChange={(patch) => patchTask(task.id, patch)}
                  onSave={() => saveTask(task.id)}
                  onCancel={() => cancelTask(task.id)}
                  onRemove={() => removeTask(task.id)}
                  onUploadFile={(file) => uploadTaskFile(task.id, file)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addTask}
              className="mt-3 text-[11px] font-semibold text-[#b8860b] hover:underline"
            >
              + Add Document Requirement
            </button>
          </div>

          <aside>
            <SubmissionChecklist
              items={checklist}
              onToggle={toggleChecklist}
            />
          </aside>
        </div>
      )}

      {tab === "Tender Info" && (
        <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tender Advertisement
              </p>
              {data.info.advertisementFile ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {data.info.advertisementFile}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Uploaded by {data.info.advertisementUploadedBy ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {data.info.advertisementUrl && (
                      <a
                        href={fullFileUrl(data.info.advertisementUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </a>
                    )}
                    <label
                      className={`cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 ${
                        uploadingAd ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      {uploadingAd ? "Uploading…" : "Replace"}
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploadingAd}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) replaceAdvertisement(f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-center text-[11px] text-slate-500">
                  No advertisement uploaded yet.
                </div>
              )}
            </div>

            <InfoField label="Tender Link">
              {data.info.tenderLink ? (
                <a
                  href={
                    data.info.tenderLink.startsWith("http")
                      ? data.info.tenderLink
                      : `https://${data.info.tenderLink}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  {data.info.tenderLink}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">
                  — (no portal link)
                </span>
              )}
            </InfoField>

            <InfoField label="Recorded By" value={data.info.recordedBy} />
            <InfoField label="Tender Type" value={data.info.tenderType} />
            <InfoField
              label="Responsible Person"
              value={data.info.responsiblePerson}
            />
            {data.info.lastDateOfPurchase && (
              <InfoField
                label="Last Date of Purchase"
                value={data.info.lastDateOfPurchase}
              />
            )}
            {data.info.lastDateOfSubmission && (
              <InfoField
                label="Last Date of Submission"
                value={data.info.lastDateOfSubmission}
              />
            )}

            <div className="pt-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Note
              </p>
              <textarea
                readOnly
                value={data.info.note ?? ""}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                File Attachments ({data.info.attachments.length})
              </p>
              <ul className="space-y-1.5">
                {data.info.attachments.length === 0 && (
                  <li className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">
                    No attachments.
                  </li>
                )}
                {data.info.attachments.map((f) => (
                  <li
                    key={f._id}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{f.name}</span>
                      {f.size > 0 && (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          ({fileSizeLabel(f.size)})
                        </span>
                      )}
                    </span>
                    {f.url && (
                      <a
                        href={fullFileUrl(f.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-indigo-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Eligibility Criteria / Important Records
              </p>
              <textarea
                readOnly
                value={data.info.eligibility ?? ""}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoField({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      {children ?? (
        <span className="text-[12px] font-medium text-slate-800">{value}</span>
      )}
    </div>
  );
}