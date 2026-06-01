'use client';

import { useState, useEffect } from 'react';
import { User, Department } from '@/types';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import api from '@/lib/axios';

interface UserFormProps {
  user?: User;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'employee',
    departmentId: '',
    dailyHoursTarget: 8,
  });

  useEffect(() => {
    fetchDepartments();
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        password: '',
        employeeId: user.employeeId,
        role: user.role,
        departmentId: typeof user.departmentId === 'object' ? user.departmentId?._id || '' : user.departmentId || '',
        dailyHoursTarget: user.dailyHoursTarget,
      });
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!user && !submitData.password) {
      return;
    }
    if (!user) {
      delete (submitData as any).id;
    }
    await onSubmit(submitData);
  };

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'dept_manager', label: 'Department Manager' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'line_manager', label: 'Line Manager' },
    { value: 'employee', label: 'Employee' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      {!user && (
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      )}
      <Input
        label="Employee ID"
        value={formData.employeeId}
        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          required
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <select
          value={formData.departmentId}
          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">No Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Hours Target</label>
        <select
          value={formData.dailyHoursTarget}
          onChange={(e) => setFormData({ ...formData, dailyHoursTarget: Number(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value={6}>6 hours</option>
          <option value={7}>7 hours</option>
          <option value={8}>8 hours</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit">{user ? 'Update' : 'Create'} User</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};