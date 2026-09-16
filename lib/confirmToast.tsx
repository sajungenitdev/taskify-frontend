// lib/confirmToast.tsx
"use client";

import toast from "react-hot-toast";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Options {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  /** "danger" paints the confirm button red */
  variant?: "danger" | "default";
}

export function confirmToast({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: Options) {
  toast(
    (t) => (
      <div className="flex flex-col gap-2.5 py-1 text-slate-900">
        <div className="flex items-start gap-2">
          {variant === "danger" && (
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-900">{title}</p>
            {description && (
              <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              onCancel?.();
            }}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await onConfirm();
              } catch {
                /* caller handles its own error toast */
              }
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {variant === "danger" && <Trash2 className="h-3 w-3" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    {
      duration: 8000,
      position: "top-center",
      style: {
        borderRadius: "1rem",
        border: "1px solid #e2e8f0",
        padding: "0.85rem 1rem",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
        background: "#ffffff",
        maxWidth: "420px",
      },
    },
  );
}