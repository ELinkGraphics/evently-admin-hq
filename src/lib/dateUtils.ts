
export type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

export const getDateRange = (period: TimePeriod) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { startDate, endDate: now };
};

export const getPreviousDateRange = (period: TimePeriod) => {
  const { startDate, endDate } = getDateRange(period);
  const duration = endDate.getTime() - startDate.getTime();
  
  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: new Date(startDate.getTime())
  };
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatCurrency = (amount: number): string => {
  return `ETB ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
