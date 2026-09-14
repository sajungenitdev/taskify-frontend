// components/crm/CrmStatCard.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
    label: string;
    value: string | number;
    sub?: string;
    icon: LucideIcon;
    accent?: string;
}

export function CrmStatCard({ label, value, sub, icon: Icon, accent }: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0d1b33]">
            <div className="flex items-center gap-4 p-5">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent ??
                        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                        }`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {label}
                    </p>
                    <p className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                    {sub && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
                    )}
                </div>
            </div>
        </div>
    );
}