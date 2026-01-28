// This function implements the daily/weekly logic mentioned in the post
import { addHours, addDays, addMonths } from 'date-fns';

export const activatePlan = (planType) => {
  const now = new Date();
  
  switch (planType) {
    case 'DAILY':
      return addDays(now, 1);
    case 'WEEKLY':
      return addDays(now, 7);
    case 'MONTHLY':
      return addMonths(now, 1);
    default:
      throw new Error("Invalid plan selected");
  }
};