// components/tasks/ExtensionStats.tsx
import { CalendarClock } from "lucide-react";

interface ExtensionStatsProps {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    canManageExtensions: boolean;
    myStats?: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export const ExtensionStats = ({
    total,
    pending,
    approved,
    rejected,
    canManageExtensions,
    myStats,
}: ExtensionStatsProps) => {
    const displayTotal = canManageExtensions ? total : myStats?.total || 0;
    const displayPending = canManageExtensions ? pending : myStats?.pending || 0;
    const displayApproved = canManageExtensions ? approved : myStats?.approved || 0;
    const displayRejected = canManageExtensions ? rejected : myStats?.rejected || 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Total Requests</p>
                <p className="text-2xl font-bold text-indigo-700">{displayTotal}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-700">{displayPending}</p>
                {displayPending > 0 && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mt-1" />
                )}
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Approved</p>
                <p className="text-2xl font-bold text-emerald-700">{displayApproved}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-4 border border-rose-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Rejected</p>
                <p className="text-2xl font-bold text-rose-700">{displayRejected}</p>
            </div>
        </div>
    );
};