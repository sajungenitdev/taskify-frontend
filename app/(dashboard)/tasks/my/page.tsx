// app/(dashboard)/tasks/my/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EmployeeTasksPage from "./EmployeeTasksPage";
import MyTasksPage from "./MyTasksPage";

export default function TasksPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    const isEmployee = user.role === "employee";

    if (isEmployee) {
        return <EmployeeTasksPage />;
    }

    return <MyTasksPage />;
}