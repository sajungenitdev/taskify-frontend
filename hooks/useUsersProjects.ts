// hooks/useUsersProjects.ts
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { ExtendedUser } from "@/types/task";

export const useUsersProjects = (user: any, tasks: any[]) => {
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
    const isMounted = useRef(true);

    const userDepartmentId = useMemo(() => {
        const extendedUser = user as ExtendedUser;
        return extendedUser?.department?._id || extendedUser?.departmentId || null;
    }, [user]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get("/users");
            if (response.data.success && isMounted.current) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            const response = await api.get("/projects");
            if (response.data.success && isMounted.current) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }, []);

    const fetchDepartmentUsers = useCallback(async () => {
        try {
            if (!userDepartmentId) {
                if (isMounted.current) setDepartmentUsers([]);
                return;
            }

            try {
                const response = await api.get(`/auth/users/department/${userDepartmentId}`);
                if (response.data.success && isMounted.current) {
                    setDepartmentUsers(response.data.data || []);
                    return;
                }
            } catch (authError) {
                console.warn("⚠️ Auth endpoint failed:", authError);
            }

            try {
                const response = await api.get(`/users/department/${userDepartmentId}`);
                if (response.data.success && isMounted.current) {
                    setDepartmentUsers(response.data.data || []);
                    return;
                }
            } catch (usersError) {
                console.warn("⚠️ Users endpoint failed:", usersError);
            }

            if (tasks && tasks.length > 0 && isMounted.current) {
                const userMap = new Map();
                tasks.forEach(task => {
                    if (task.assignedTo && task.assignedTo._id) {
                        userMap.set(task.assignedTo._id, {
                            _id: task.assignedTo._id,
                            fullName: task.assignedTo.fullName,
                            email: task.assignedTo.email
                        });
                    }
                });
                setDepartmentUsers(Array.from(userMap.values()));
                return;
            }

            if (isMounted.current) setDepartmentUsers([]);
        } catch (error) {
            console.error("❌ Error fetching department users:", error);
            if (isMounted.current) setDepartmentUsers([]);
        }
    }, [userDepartmentId, tasks]);

    const getAvailableUsers = useMemo(() => {
        const userRole = user?.role;
        const isSuperAdmin = userRole === "super_admin";
        const isAdmin = userRole === "admin";
        const isHrManager = userRole === "hr_manager";
        const isDepartmentManager = userRole === "dept_manager" || userRole === "project_manager" || userRole === "line_manager";

        if (isSuperAdmin || isAdmin || isHrManager) {
            return users;
        }

        if (isDepartmentManager && userDepartmentId) {
            if (departmentUsers.length > 0) {
                return departmentUsers;
            }

            const filtered = users.filter(u =>
                (u as any).department?._id === userDepartmentId ||
                (u as any).departmentId === userDepartmentId
            );

            return filtered.length > 0 ? filtered : users;
        }

        return users;
    }, [users, userDepartmentId, departmentUsers, user?.role]);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        users,
        projects,
        departmentUsers,
        userDepartmentId,
        getAvailableUsers,
        fetchUsers,
        fetchProjects,
        fetchDepartmentUsers,
    };
};