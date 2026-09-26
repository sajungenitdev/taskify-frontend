// components/tender/submission/SubmissionDetail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { DocTaskRow, type DocTask, type DocStatus } from "./DocTaskRow";
import { SubmissionChecklist } from "./SubmissionChecklist";
import { ReadinessBar } from "./ReadinessBar";
import { docTaskApi, tenderApi } from "@/lib/api/tender.api";
import { confirmToast } from "@/lib/confirmToast";
import toast from "react-hot-toast";

export interface SubmissionAttachment {
  _id?: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
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
    value?: string;
    tone?: "neutral" | "progress" | "warn";
    checked?: boolean;
    isCustom?: boolean;
  }[];
  info: SubmissionInfoPayload;
  /** ✅ Notify Finance trigger — opens the modal in the parent */
  notifyAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
}

interface Props {
  data: SubmissionDetailData;
  onTaskMutated?: () => void;
  submitAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
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

export function SubmissionDetail({
  data,
  onTaskMutated,
  submitAction,
}: Props) {
  const [tab, setTab] = useState<Tab>("Tender Preparation");
  const [showDetails, setShowDetails] = useState(true);
  const [tasks, setTasks] = useState<DocTask[]>(data.docTasks);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [uploadingAtt, setUploadingAtt] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const adInputRef = useRef<HTMLInputElement>(null);

  const checklist = data.checklist;

  useEffect(() => {
    setTasks(data.docTasks);
    if (adInputRef.current) adInputRef.current.value = "";
  }, [data.id, data.docTasks]);

  /* ---------- Doc tasks (unchanged) ---------- */
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

    const hasPendingFile = !!task.pendingFile;
    const safeStatus: DocStatus =
      task.status === "Done" && !hasPendingFile && !task.fileUrl
        ? "Pending"
        : task.status;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: finalTitle,
              owner: finalOwner,
              status: safeStatus,
              isDraft: false,
            }
          : t,
      ),
    );

    try {
      const created = await docTaskApi.add(data.id, {
        title: finalTitle,
        owner: finalOwner,
        status: safeStatus,
        fileName: task.fileName,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, id: created._id, status: safeStatus, isDraft: false }
            : t,
        ),
      );

      if (task.pendingFile) {
        const loadingId = toast.loading(
          `Uploading ${task.pendingFile.name}...`,
        );
        try {
          const att = await tenderApi.uploadAttachment(
            data.id,
            task.pendingFile,
          );

          await docTaskApi.update(data.id, created._id, {
            fileName: att.name,
            fileUrl: att.url,
            status: "Done",
          });

          setTasks((prev) =>
            prev.map((t) =>
              t.id === created._id
                ? {
                    ...t,
                    fileName: att.name,
                    fileUrl: fullFileUrl(att.url),
                    status: "Done",
                    pendingFile: null,
                  }
                : t,
            ),
          );

          toast.success("Task + file saved", { id: loadingId });
        } catch (e) {
          toast.error(
            (e as Error).message || "File upload failed",
            { id: loadingId },
          );
        }
      } else {
        toast.success("Document task added");
      }

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
    const snapshot = tasks;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, fileName: file.name, status: "In Progress" }
          : t,
      ),
    );

    try {
      const att = await tenderApi.uploadAttachment(data.id, file);

      await docTaskApi.update(data.id, taskId, {
        fileName: att.name,
        fileUrl: att.url,
        status: "Done",
      });

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
      toast.error((e as Error).message || "Upload failed", {
        id: loadingId,
      });
      setTasks(snapshot);
    }
  };

  /* ---------- Advertisement (unchanged) ---------- */
  const uploadAdvertisement = async (file: File) => {
    setUploadingAd(true);
    const loadingId = toast.loading(`Uploading ${file.name}...`);
    try {
      await tenderApi.uploadAdvertisement(data.id, file);
      toast.success(
        data.info.advertisementFile
          ? "Advertisement replaced"
          : "Advertisement uploaded",
        { id: loadingId },
      );
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed", {
        id: loadingId,
      });
    } finally {
      setUploadingAd(false);
      if (adInputRef.current) adInputRef.current.value = "";
    }
  };

  const deleteAdvertisement = () => {
    if (!data.info.advertisementFile) return;
    confirmToast({
      title: "Delete advertisement?",
      description:
        "The advertisement file will be permanently removed from this tender.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeletingAd(true);
        const loadingId = toast.loading("Removing advertisement...");
        try {
          await tenderApi.deleteAdvertisement(data.id);
          toast.success("Advertisement removed", { id: loadingId });
          onTaskMutated?.();
        } catch (e) {
          toast.error(
            (e as Error).message || "Delete failed",
            { id: loadingId },
          );
        } finally {
          setDeletingAd(false);
        }
      },
    });
  };

  /* ---------- Attachments (unchanged) ---------- */
  const handleAttachFile = async (file: File) => {
    setUploadingAtt(true);
    const loadingId = toast.loading(`Uploading ${file.name}...`);
    try {
      await tenderApi.uploadAttachment(data.id, file);
      toast.success("File attached", { id: loadingId });
      onTaskMutated?.();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed", {
        id: loadingId,
      });
    } finally {
      setUploadingAtt(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  };

  const deleteAttachment = (attachmentId: string, name: string) => {
    confirmToast({
      title: `Delete "${name}"?`,
      description: "This file will be permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeletingAttId(attachmentId);
        const loadingId = toast.loading("Removing file...");
        try {
          await tenderApi.deleteAttachment(data.id, attachmentId);
          toast.success("File removed", { id: loadingId });
          onTaskMutated?.();
        } catch (e) {
          toast.error(
            (e as Error).message || "Delete failed",
            { id: loadingId },
          );
        } finally {
          setDeletingAttId(null);
        }
      },
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* ============ HEADER ============ */}
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

        <div className="flex shrink-0 items-center gap-2">
          {/* Notify Finance — opens modal in parent */}
          {data.notifyAction && (
            <button
              type="button"
              onClick={data.notifyAction.onClick}
              disabled={
                data.notifyAction.loading || data.notifyAction.disabled
              }
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-[12px] font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a97400]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {data.notifyAction.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Notifying...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 text-[#a97400]" />
                  {data.notifyAction.label}
                </>
              )}
            </button>
          )}

          {/* Submit Tender */}
          {submitAction && (
            <button
              type="button"
              onClick={submitAction.onClick}
              disabled={submitAction.loading || submitAction.disabled}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#a97400] px-5 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitAction.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {submitAction.label}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
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

      {/* Tender Preparation */}
      {tab === "Tender Preparation" && showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-5">
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

          <aside className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
            <SubmissionChecklist items={checklist} />
          </aside>
        </div>
      )}

      {/* Tender Info — unchanged from your original */}
      {tab === "Tender Info" && (
        <div className="grid grid-cols-1 items-stretch gap-8 p-5 lg:grid-cols-2">
          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tender Advertisement
              </p>

              <input
                ref={adInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadAdvertisement(f);
                }}
              />

              {data.info.advertisementFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-800">
                        {data.info.advertisementFile}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Uploaded by{" "}
                        {data.info.advertisementUploadedBy ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {data.info.advertisementUrl && (
                      <a
                        href={fullFileUrl(data.info.advertisementUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => adInputRef.current?.click()}
                      disabled={uploadingAd || deletingAd}
                      className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingAd ? "Uploading…" : "Replace"}
                    </button>
                    <button
                      type="button"
                      onClick={deleteAdvertisement}
                      disabled={deletingAd || uploadingAd}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete advertisement"
                      aria-label="Delete advertisement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => adInputRef.current?.click()}
                  disabled={uploadingAd}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-3 text-left transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-amber-600 shadow-sm">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-700">
                        {uploadingAd
                          ? "Uploading advertisement…"
                          : "Upload advertisement"}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Image or PDF — up to 15 MB
                      </span>
                    </span>
                  </span>
                </button>
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

            <div className="mt-auto pt-2">
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

          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                File Attachments ({data.info.attachments.length})
              </p>

              <ul className="space-y-1.5">
                {data.info.attachments.length === 0 && (
                  <li className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">
                    No attachments yet.
                  </li>
                )}
                {data.info.attachments.map((f) => {
                  const deleting = deletingAttId === f._id;
                  return (
                    <li
                      key={f._id}
                      className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{f.name}</span>
                        {typeof f.size === "number" && f.size > 0 && (
                          <span className="shrink-0 text-[10px] text-slate-400">
                            ({fileSizeLabel(f.size)})
                          </span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
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
                        {typeof f._id === "string" && (
                          <button
                            type="button"
                            onClick={() => deleteAttachment(f._id!, f.name)}
                            disabled={deleting}
                            className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Delete file"
                            aria-label="Delete file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3">
                <input
                  ref={attachInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  disabled={uploadingAtt}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAttachFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  disabled={uploadingAtt}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-700">
                        {uploadingAtt
                          ? "Uploading…"
                          : "Choose a file to upload"}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        PDF, images, Word, Excel — up to 25 MB
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-auto">
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

export default SubmissionDetail;