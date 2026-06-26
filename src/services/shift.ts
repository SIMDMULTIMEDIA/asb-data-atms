export interface ShiftInfo {
  shift: "Morning" | "Evening" | "Night";
  isLate: boolean;
  shiftStart: Date;
  shiftEnd: Date;
  deadlineAt: Date;
}

export const getCurrentShift = (date: Date = new Date()): ShiftInfo => {
  const hours = date.getHours();
  let shift: "Morning" | "Evening" | "Night" = "Night";
  
  const shiftStart = new Date(date);
  const shiftEnd = new Date(date);
  const deadlineAt = new Date(date);

  if (hours >= 6 && hours < 14) {
    shift = "Morning";
    shiftStart.setHours(6, 0, 0, 0);
    shiftEnd.setHours(13, 59, 59, 999);
    deadlineAt.setHours(14, 0, 0, 0); // 2:00 PM
  } else if (hours >= 14 && hours < 22) {
    shift = "Evening";
    shiftStart.setHours(14, 0, 0, 0);
    shiftEnd.setHours(21, 59, 59, 999);
    deadlineAt.setHours(22, 0, 0, 0); // 10:00 PM
  } else {
    shift = "Night";
    // If it's before 6 AM, the shift started the previous day at 10 PM
    if (hours >= 22) {
      shiftStart.setHours(22, 0, 0, 0);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(5, 59, 59, 999);
      
      deadlineAt.setDate(deadlineAt.getDate() + 1);
      deadlineAt.setHours(6, 0, 0, 0); // 6:00 AM
    } else {
      shiftStart.setDate(shiftStart.getDate() - 1);
      shiftStart.setHours(22, 0, 0, 0);
      shiftEnd.setHours(5, 59, 59, 999);
      
      deadlineAt.setHours(6, 0, 0, 0); // 6:00 AM
    }
  }

  // Is late if the current time is past the deadline
  const isLate = date.getTime() > deadlineAt.getTime();

  return { shift, isLate, shiftStart, shiftEnd, deadlineAt };
};

export const validateReportSubmission = (
  reportShift: string, 
  allowPreviousWithOverride: boolean = false
): { valid: boolean; reason?: string } => {
  const { shift: currentShift } = getCurrentShift();
  
  if (reportShift === currentShift) {
    return { valid: true };
  }

  // Simplified previous shift logic. A real enterprise system would map the shifts in an ordered array
  // and check if reportShift is exactly index - 1. 
  const shifts = ["Morning", "Evening", "Night"];
  const currentIndex = shifts.indexOf(currentShift);
  const reportIndex = shifts.indexOf(reportShift);

  // If report index is exactly 1 before current, or if current is Morning and report is Night
  const isPreviousShift = 
    (currentIndex === 0 && reportIndex === 2) || 
    (reportIndex === currentIndex - 1);

  if (isPreviousShift) {
    if (allowPreviousWithOverride) {
      return { valid: true };
    } else {
      return { valid: false, reason: "Submitting for a previous shift requires supervisor override." };
    }
  }

  return { valid: false, reason: "Cannot submit reports for future or invalid shifts." };
};

export const validateAttendanceShift = (userShift: string): { valid: boolean; currentShift: string; reason?: string } => {
  const { shift: currentShift } = getCurrentShift();
  
  // Note: userShift comes from the UserProfile in Firestore
  if (userShift === currentShift) {
    return { valid: true, currentShift };
  }
  
  return { 
    valid: false, 
    currentShift, 
    reason: `Check-in denied. Your assigned shift is ${userShift}, but the current active shift is ${currentShift}.` 
  };
};
