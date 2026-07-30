// utils/dateHelpers.ts

export {}

import api from "@/lib/axios"; // ← Add this import

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    monthName: months[now.getMonth()],
  };
};

export const fetchMonthlyKPIReport = async () => {
  const { month, year } = getCurrentMonthYear();
  const response = await api.get(`/kpi/report/monthly?month=${month}&year=${year}`);
  return response.data;
};

export const getMonths = () => months;

export const getCurrentMonth = () => {
  const now = new Date();
  return now.getMonth() + 1;
};

export const getCurrentYear = () => {
  const now = new Date();
  return now.getFullYear();
};

export const getCurrentMonthName = () => {
  const now = new Date();
  return months[now.getMonth()];
};

export const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const getDateRange = (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};

export const isDateInRange = (date: Date, month: number, year: number) => {
  return date.getMonth() === month - 1 && date.getFullYear() === year;
};