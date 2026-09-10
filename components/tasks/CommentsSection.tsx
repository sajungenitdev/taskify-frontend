"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import type { Comment } from "../../types/tasks";
import { getInitials } from "../../utils/formatters";
import { CommentItem } from "./CommentItem";

interface Props {
  taskId: string;
  comments: Comment[];
  onCommentUpdate: () => void;
}

const MAX_LENGTH = 1000;

export function CommentsSection({ taskId, comments, onCommentUpdate }: Props) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ------------------------------------------------------------------
  // Auto-resize textarea (1 line -> grows to max ~6 rows)
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 160); // ~6 rows max
    el.style.height = `${next}px`;
  }, [newComment]);

  // ------------------------------------------------------------------
  // Submit — optimistic add
  // ------------------------------------------------------------------
  const handleAdd = useCallback(async () => {
    const content = newComment.trim();
    if (!content) return;
    if (submitting) return;

    // Fire-and-forget: reset input instantly
    setNewComment("");
    setSubmitting(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      await api.post(`/tasks/${taskId}/comments`, { content });
      // Refetch in background — no toast on success, feels snappier
      onCommentUpdate();
    } catch (err: any) {
      // Restore input if it failed so the user doesn't lose their text
      setNewComment(content);
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting, taskId, onCommentUpdate]);

  // ------------------------------------------------------------------
  // Keyboard shortcuts: Ctrl/Cmd + Enter sends
  // ------------------------------------------------------------------
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const canSubmit = useMemo(
    () => newComment.trim().length > 0 && !submitting,
    [newComment, submitting]
  );

  const isNearLimit = newComment.length > MAX_LENGTH * 0.8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
      className="bg-white rounded-2xl rounded-b-none overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">
            Notes &amp; Comments
          </h2>
          {comments.length > 0 && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ------------------------------------------------------------ */}
        {/* Composer                                                     */}
        {/* ------------------------------------------------------------ */}
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">
              {getInitials(user?.fullName || "?")}
            </span>
          </div>

          {/* Input + send */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div
              className={`flex items-end gap-2 bg-gray-50 border rounded-xl px-3 py-2 transition-colors ${
                newComment.trim()
                  ? "border-indigo-300 ring-1 ring-indigo-100 bg-white"
                  : "border-gray-200"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment…  (Ctrl+Enter to send)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed py-1.5 max-h-40 custom-scrollbar"
              />
              <button
                onClick={handleAdd}
                disabled={!canSubmit}
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  canSubmit
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send comment"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>

            {/* Character counter (only when close to limit) */}
            {isNearLimit && (
              <div className="flex justify-end pr-1">
                <span
                  className={`text-[10px] font-medium ${
                    newComment.length >= MAX_LENGTH
                      ? "text-rose-500"
                      : "text-gray-400"
                  }`}
                >
                  {newComment.length} / {MAX_LENGTH}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Comments list                                                */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
          {comments.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <CommentItem
                    comment={c}
                    onCommentUpdate={onCommentUpdate}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Empty state
// ------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-600">No comments yet</p>
      <p className="text-xs text-gray-400 mt-1">
        Start the conversation — share updates, blockers, or feedback.
      </p>
    </div>
  );
}