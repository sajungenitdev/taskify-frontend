"use client";

export interface FilterState {
    entity: string;   // "all" | "NGL-26" | "NG-26" | "JT"
    type: string;     // "all" | "Tender Security" | "Performance Security" | "Bank Guarantee"
    docs: string;     // "all" | "Attached" | "Missing"
}

interface Props {
    value: FilterState;
    entities: string[];
    types: string[];
    onChange: (next: FilterState) => void;
}

const baseSelect =
    "h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none";

export function SecurityFilters({
    value,
    entities,
    types,
    onChange,
}: Props) {
    return (
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <select
                className={baseSelect}
                value={value.entity}
                onChange={(e) => onChange({ ...value, entity: e.target.value })}
            >
                <option value="all">All Entities</option>
                {entities.map((e) => (
                    <option key={e} value={e}>
                        {e}
                    </option>
                ))}
            </select>

            <select
                className={baseSelect}
                value={value.type}
                onChange={(e) => onChange({ ...value, type: e.target.value })}
            >
                <option value="all">All Types</option>
                {types.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>

            <select
                className={baseSelect}
                value={value.docs}
                onChange={(e) => onChange({ ...value, docs: e.target.value })}
            >
                <option value="all">All Docs Status</option>
                <option value="Attached">Attached</option>
                <option value="Missing">Missing</option>
            </select>
        </section>
    );
}