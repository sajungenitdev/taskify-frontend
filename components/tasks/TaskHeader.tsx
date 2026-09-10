"use client";
import { Gem } from "lucide-react";
import { TaskBadges } from "./TaskBadges";
import { getPriorityConfig, getStatusConfig } from "@/utils/configs";
import { Attachment, Task } from "@/types/tasks";
import { formatDate } from "@/utils/formatters";

interface Props {
  task: Task;
  attachments: Attachment[];
  hasSubmittedEvidence: boolean;
}

export function TaskHeader({ task, attachments, hasSubmittedEvidence }: Props) {
  return (
    <div className="border-b px-6 py-4 bg-black rounded-2xl rounded-b-none">
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color}`}>
          {getPriorityConfig(task.priority).icon} {task.priority.toUpperCase()}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color}`}>
          {getStatusConfig(task.status).icon} {task.status.replace("_", " ").toUpperCase()}
        </span>
        <TaskBadges task={task} attachments={attachments} hasSubmittedEvidence={hasSubmittedEvidence} />
      </div>
      <div className="pt-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
          {task.isMilestone && <Gem className="w-6 h-6 text-purple-500 inline mr-2" />}
          {task.title}
        </h1>
        <div className="flex">
          <div className="flex">
            <p className="text-xs text-gray-500 mb-0.5">Assigned By: </p>
            <p className="text-xs text-gray-500 mb-0.5 ps-1">{task.assignedBy?.fullName || "Unknown"}</p>
          </div>
          <div className="flex ps-2">
            <p className="text-xs text-gray-500 mb-0.5">EST: {task.estimatedHours} hours</p>
          </div>
          <div className="flex ps-2">
            <p className="text-xs text-gray-500 mb-0.5">Due: {formatDate(task.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}