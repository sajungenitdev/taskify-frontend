// components/crm/DealKanban.tsx
"use client";

import React, { useMemo, useState, memo, useCallback } from "react";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
    defaultDropAnimationSideEffects,
    type DropAnimation,
} from "@dnd-kit/core";
import { AlertCircle, KanbanSquare, RefreshCw } from "lucide-react";
import { usePipeline } from "@/hooks/crm/useLeads";
import { leadApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import { DealStageColumn } from "./DealStageColumn";
import { DealCard } from "./DealCard";
import type { Lead, PipelineGroup } from "@/types/crm/crm.types";

interface Props {
    onAddDeal?: (stage: string) => void;
}

// Ultra-smooth 60fps drop animation easing
const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.4",
            },
        },
    }),
    duration: 220,
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

export const DealKanban = memo(function DealKanban({ onAddDeal }: Props) {
    const { data, loading, error, refetch } = usePipeline();
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    // Optimized sensor activation constraints: 
    // 4px threshold triggers instantly without locking normal link navigation
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const groups: PipelineGroup[] = useMemo(() => data?.grouped ?? [], [data]);

    const findStageOfLead = useCallback(
        (id: string): string | undefined => {
            for (let i = 0; i < groups.length; i++) {
                if (groups[i].leads.some((l) => l._id === id)) {
                    return groups[i].stage;
                }
            }
            return undefined;
        },
        [groups]
    );

    const onDragStart = useCallback(
        (e: DragStartEvent) => {
            const id = String(e.active.id);
            for (const g of groups) {
                const found = g.leads.find((l) => l._id === id);
                if (found) {
                    setActiveLead(found);
                    break;
                }
            }
        },
        [groups]
    );

    const onDragCancel = useCallback(() => {
        setActiveLead(null);
    }, []);

    const onDragEnd = useCallback(
        async (e: DragEndEvent) => {
            const { active, over } = e;
            setActiveLead(null);
            if (!over) return;

            const leadId = String(active.id);
            const overId = String(over.id);

            const fromStage = findStageOfLead(leadId);
            if (!fromStage) return;

            let toStage: string | undefined;
            if (groups.some((g) => g.stage === overId)) {
                toStage = overId;
            } else {
                toStage = findStageOfLead(overId);
            }

            if (!toStage || fromStage === toStage) return;

            setPendingId(leadId);
            try {
                await leadApi.changeStage(leadId, toStage);
                toast.success(`Moved to ${toStage.replace(/_/g, " ")}`);
                refetch();
            } catch (err) {
                toast.error((err as Error).message || "Failed to update deal stage");
                refetch();
            } finally {
                setPendingId(null);
            }
        },
        [groups, findStageOfLead, refetch]
    );

    // Custom collision detection: checks pointer position first, falls back to rect intersection
    const collisionDetectionStrategy = useCallback(
        (args: Parameters<typeof pointerWithin>[0]) => {
            const pointerCollisions = pointerWithin(args);
            if (pointerCollisions.length > 0) {
                return pointerCollisions;
            }
            return rectIntersection(args);
        },
        []
    );

    /* ---------- Loading Skeleton ---------- */
    if (loading && !data) {
        return (
            <div className="flex h-full min-h-0 gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex h-full w-80 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
                            <div className="h-4 w-10 animate-pulse rounded-md bg-slate-200" />
                        </div>
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 3 }).map((__, j) => (
                                <div
                                    key={j}
                                    className="h-28 animate-pulse rounded-xl border border-slate-200/60 bg-white"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* ---------- Error State ---------- */
    if (error) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/60 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-rose-900">
                        Couldn&apos;t load the pipeline
                    </p>
                    <p className="mt-1 max-w-md text-xs font-medium text-rose-600">
                        {error}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-50 cursor-pointer"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Loading</span>
                </button>
            </div>
        );
    }

    /* ---------- Empty Board ---------- */
    if (groups.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-2xs">
                    <KanbanSquare className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">
                        No pipeline stages configured
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                        No stages found in your pipeline configuration. Verify seed settings or backend endpoints.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh Stages</span>
                </button>
            </div>
        );
    }

    /* ---------- Live Kanban Board ---------- */
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
        >
            <div className="h-full min-h-0 w-full overflow-x-auto overflow-y-hidden pb-1 select-none">
                <div className="flex h-full min-w-max items-stretch gap-4">
                    {groups.map((g) => (
                        <DealStageColumn
                            key={g.stage}
                            group={g}
                            onAdd={onAddDeal}
                            pendingId={pendingId}
                        />
                    ))}
                </div>
            </div>

            {/* Hardware-accelerated drag preview */}
            <DragOverlay dropAnimation={dropAnimationConfig}>
                {activeLead ? (
                    <div className="w-80 cursor-grabbing will-change-transform">
                        <DealCard lead={activeLead} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});