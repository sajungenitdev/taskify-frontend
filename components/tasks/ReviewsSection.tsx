"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Star, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Review } from "../../types/tasks";
import { formatDateTime, getInitials } from "../../utils/formatters";

interface Props {
    reviews: Review[];
    reviewStats: { total: number; averageRating: number; ratingDistribution: any };
    currentUserId?: string;
    canManage: boolean;
    onDelete: (reviewId: string) => void;
}

export function ReviewsSection({ reviews, reviewStats, currentUserId, canManage, onDelete }: Props) {
    const [open, setOpen] = useState(true);
    if (reviews.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-gray-800">Reviews ({reviews.length})</h3>
                    {reviewStats.averageRating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <Star size={14} className="fill-amber-500 text-amber-500" />
                            <span className="text-gray-800 text-sm font-medium">{reviewStats.averageRating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                {open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>

            {open && (
                <div className="p-5 pt-0 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {reviews.map((review) => (
                        <div key={review._id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                        <span className="text-white text-sm font-bold">{getInitials(review.reviewer?.fullName)}</span>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium">{review.reviewer?.fullName}</p>
                                        <p className="text-gray-400 text-xs">{formatDateTime(review.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                                        ))}
                                    </div>
                                    {(canManage || review.reviewer?._id === currentUserId) && (
                                        <button
                                            onClick={() => onDelete(review._id)}
                                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}