// utils/dateHelpers.ts or in the component

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    monthName: months[now.getMonth()],
  };
};

// Use in API call
const { month, year } = getCurrentMonthYear();
const response = await api.get(
  `/kpi/report/monthly?month=${month}&year=${year}`,
);
