"use client";
import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  ThumbsUp,
  Reply,
  Send,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import type { Comment } from "../../types/tasks";
import { formatDateTime, getInitials } from "../../utils/formatters";

interface Props {
  comment: Comment;
  depth?: number;
  onCommentUpdate: () => void;
}

export function CommentItem({ comment, depth = 0, onCommentUpdate }: Props) {
  const { user } = useAuth();
  const { id } = useParams();
  const [showReply, setShowReply] = useState(false);
  const [localReplyContent, setLocalReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLiked = comment.likes?.includes(user?._id || "");
  const canManage =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "hr_manager";

  // ------------------------------------------------------------------
  // Escape key + body scroll lock while confirm dialog is open
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmOpen, deleting]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  const handleLike = useCallback(async () => {
    try {
      await api.post(`/tasks/${id}/comments/${comment._id}/like`);
      onCommentUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to like comment");
    }
  }, [id, comment._id, onCommentUpdate]);

  const performDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${id}/comments/${comment._id}`);
      toast.success("Comment deleted");
      setConfirmOpen(false);
      onCommentUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  }, [id, comment._id, onCommentUpdate]);

  const handleUpdate = useCallback(async () => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/tasks/${id}/comments/${comment._id}`, {
        content: editContent,
      });
      toast.success("Comment updated");
      setEditing(false);
      onCommentUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update comment");
    }
  }, [editContent, id, comment._id, onCommentUpdate]);

  const handleReply = useCallback(async () => {
    if (!localReplyContent.trim()) return;
    try {
      await api.post(`/tasks/${id}/comments`, {
        content: localReplyContent,
        parentCommentId: comment._id,
      });
      toast.success("Reply added");
      setLocalReplyContent("");
      setShowReply(false);
      onCommentUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add reply");
    }
  }, [localReplyContent, id, comment._id, onCommentUpdate]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className={depth > 0 ? "ml-8 mt-3" : "mb-4"}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">
              {getInitials(comment.author?.fullName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
              <div>
                <span className="text-gray-800 text-sm font-medium">
                  {comment.author?.fullName}
                </span>
                <span className="text-gray-400 text-xs ml-2">
                  {formatDateTime(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-gray-400 text-xs ml-2">(edited)</span>
                )}
              </div>
              {(comment.author?._id === user?._id || canManage) && (
                <div className="flex items-center gap-1">
                  {comment.author?._id === user?._id && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setEditContent(comment.content);
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUpdate}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition ${isLiked
                    ? "text-indigo-600"
                    : "text-gray-400 hover:text-indigo-600"
                  }`}
              >
                <ThumbsUp size={12} /> {comment.likes?.length || 0} Likes
              </button>
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition"
              >
                <Reply size={12} /> Reply
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReply && (
        <div className="mt-2 ml-8 flex gap-2">
          <textarea
            value={localReplyContent}
            onChange={(e) => setLocalReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleReply();
              }
            }}
            placeholder="Write a reply…  (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <button
            onClick={handleReply}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          depth={depth + 1}
          onCommentUpdate={onCommentUpdate}
        />
      ))}

      {/* -------------------------------------------------------------- */}
      {/* Modern delete confirmation dialog (inline, no external file)   */}
      {/* -------------------------------------------------------------- */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => !deleting && setConfirmOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Close (X) */}
              <button
                onClick={() => !deleting && setConfirmOpen(false)}
                disabled={deleting}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="p-6 pt-7 text-center">
                {/* Icon */}
                <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 ring-8 ring-rose-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                  Delete comment?
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  This comment{comment.replies?.length ? " and its replies" : ""}{" "}
                  will be permanently removed. This action cannot be undone.
                </p>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    disabled={deleting}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition disabled:opacity-50"
                  >
                    Keep
                  </button>
                  <button
                    onClick={performDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {deleting && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}