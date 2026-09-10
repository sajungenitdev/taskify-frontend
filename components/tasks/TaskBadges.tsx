"use client";
import { GitBranch, Gem, Link2, Paperclip } from "lucide-react";
import type { Task, Attachment } from "../_types";

interface Props {
    task: Task;
    attachments: Attachment[];
    hasSubmittedEvidence: boolean;
}

export function TaskBadges({ task, attachments, hasSubmittedEvidence }: Props) {
    const hasEvidence =
        (task.evidenceUrls && task.evidenceUrls.length > 0) ||
        attachments.length > 0 ||
        hasSubmittedEvidence;

    return (
        <>
            {task.parentTaskId && typeof task.parentTaskId === "object" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-600 text-[10px] font-semibold">
                    <GitBranch className="w-3 h-3" />
                    Sub-Task of: {task.parentTaskId.title}
                </span>
            )}

            {task.isMilestone && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-semibold">
                    <Gem className="w-3 h-3" />
                    MILESTONE
                </span>
            )}

            {task.subTaskCount && task.subTaskCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 text-[10px] font-semibold">
                    <GitBranch className="w-3 h-3" />
                    {task.completedSubTaskCount || 0}/{task.subTaskCount} sub-tasks
                </span>
            ) : null}

            {task.dependencies && task.dependencies.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 text-[10px] font-semibold">
                    <Link2 className="w-3 h-3" />
                    {task.dependencies.length} dependencies
                </span>
            )}

            {task.evidenceRequired && (
                <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${hasEvidence
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                >
                    <Paperclip size={12} />
                    {hasEvidence ? "Evidence Submitted" : "Evidence Required"}
                </span>
            )}
        </>
    );
}