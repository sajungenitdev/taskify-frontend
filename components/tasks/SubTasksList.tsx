"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Task } from "../_types";

interface Props {
  subTasks: Task[];
}

export function SubTasksList({ subTasks }: Props) {
  if (subTasks.length === 0) return null;

  const completed = subTasks.filter((st) => st.status === "completed").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="p-5 pt-0 ps-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs pb-2 font-bold uppercase tracking-wider text-gray-500">
            Sub-Tasks ({completed}/{subTasks.length} done)
          </h3>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${subTasks.length > 0 ? (completed / subTasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className="px-5 pb-5 ps-0 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {subTasks.map((subTask) => {
          const isCompleted = subTask.status === "completed";
          return (
            <Link
              key={subTask._id}
              href={`/tasks/${subTask._id}`}
              className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded border border-gray-300 bg-white group-hover:border-blue-500 transition" />
                  )}
                </div>
                <p
                  className={`text-sm truncate ${
                    isCompleted ? "text-gray-400 line-through" : "text-gray-700 font-normal"
                  }`}
                >
                  {subTask.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}