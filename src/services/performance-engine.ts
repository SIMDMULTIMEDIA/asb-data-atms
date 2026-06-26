import { collection, query, where, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { EmployeePerformance, KPIWeights } from "@/types";
import { getKPIWeights } from "./settings";

/**
 * Helper to get the first and last day of a month "YYYY-MM"
 */
const getMonthRange = (periodId: string) => {
  const [yearStr, monthStr] = periodId.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  
  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate)
  };
};

/**
 * Calculates and saves the performance score for a specific user for a given month.
 */
export const calculateUserKPI = async (
  userId: string, 
  department: string, 
  periodId: string
): Promise<EmployeePerformance | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in calculateUserKPI");
    return null;
  }

  const { start, end } = getMonthRange(periodId);
  const startMillis = start.toMillis();
  const endMillis = end.toMillis();

  // 1. Fetch KPI Weights Snapshot
  const weights = await getKPIWeights();
  if (!weights) return null;

  // --- Attendance ---
  const attQ = query(collection(db, "attendance"), where("userId", "==", userId));
  const attSnap = await getDocs(attQ);
  let daysPresent = 0;
  attSnap.docs.forEach(d => {
    const data = d.data();
    if (data.checkIn && data.checkIn.toMillis() >= startMillis && data.checkIn.toMillis() <= endMillis) {
      if (data.status === "present" || data.status === "late") daysPresent++;
    }
  });
  // Assume 22 working days max for simplicity
  const expectedDays = 22;
  const attendanceRaw = expectedDays > 0 ? Math.min((daysPresent / expectedDays) * 100, 100) : 100;

  // --- Tasks ---
  // In a real app we'd use array-contains on assignedTo.assignees, but we'll fetch all and filter for now to avoid missing indexes
  const tasksQ = query(collection(db, "tasks"));
  const tasksSnap = await getDocs(tasksQ);
  let tasksAssigned = 0;
  let tasksCompleted = 0;
  tasksSnap.docs.forEach(d => {
    const data = d.data();
    if (data.createdAt && data.createdAt.toMillis() >= startMillis && data.createdAt.toMillis() <= endMillis) {
      if (data.assignedTo?.assignees?.includes(userId)) {
        tasksAssigned++;
        if (data.status === "completed" || data.status === "approved") {
          tasksCompleted++;
        }
      }
    }
  });
  const taskRaw = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 100;

  // --- Reports ---
  const repQ = query(collection(db, "reports"), where("userId", "==", userId));
  const repSnap = await getDocs(repQ);
  let reportsSubmitted = 0;
  repSnap.docs.forEach(d => {
    const data = d.data();
    if (data.createdAt && data.createdAt.toMillis() >= startMillis && data.createdAt.toMillis() <= endMillis) {
      if (data.status === "submitted" || data.status === "approved") reportsSubmitted++;
    }
  });
  // E.g., expect 4 reports per month
  const expectedReports = 4;
  const reportRaw = expectedReports > 0 ? Math.min((reportsSubmitted / expectedReports) * 100, 100) : 100;

  // --- Customer Ratings ---
  const ratQ = query(collection(db, "customer_ratings"), where("staffId", "==", userId));
  const ratSnap = await getDocs(ratQ);
  let totalRating = 0;
  let ratingCount = 0;
  ratSnap.docs.forEach(d => {
    const data = d.data();
    if (data.createdAt && data.createdAt.toMillis() >= startMillis && data.createdAt.toMillis() <= endMillis) {
      totalRating += data.rating || 0;
      ratingCount++;
    }
  });
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 5; // Default to 5 if no ratings
  const ratingRaw = (avgRating / 5) * 100;

  // --- Conversions ---
  const convQ = query(collection(db, "customer_interactions"), where("staffId", "==", userId));
  const convSnap = await getDocs(convQ);
  let totalLeads = 0;
  let conversions = 0;
  convSnap.docs.forEach(d => {
    const data = d.data();
    if (data.createdAt && data.createdAt.toMillis() >= startMillis && data.createdAt.toMillis() <= endMillis) {
      totalLeads++;
      if (data.outcome === "converted") conversions++;
    }
  });
  // Or raw count vs target, for now we do ratio, default 100 if no leads assigned
  const conversionRaw = totalLeads > 0 ? (conversions / totalLeads) * 100 : 100; 

  // Apply weights
  const finalScoreRaw = 
    (attendanceRaw * (weights.attendance / 100)) +
    (taskRaw * (weights.tasks / 100)) +
    (reportRaw * (weights.reports / 100)) +
    (ratingRaw * (weights.customerRating / 100)) +
    (conversionRaw * (weights.leadConversion / 100));

  const finalScore = Math.round(finalScoreRaw);
  const [yearStr, monthStr] = periodId.split("-");

  const perfId = `${userId}-${periodId}`;

  const perfData: EmployeePerformance = {
    id: perfId,
    userId,
    month: periodId,
    year: parseInt(yearStr),
    department,
    attendanceScore: Math.round(attendanceRaw),
    reportScore: Math.round(reportRaw),
    taskScore: Math.round(taskRaw),
    customerRatingScore: Math.round(ratingRaw),
    conversionScore: Math.round(conversionRaw),
    finalScore,
    weightsSnapshot: weights, // Lock weights
    generatedAt: Timestamp.now()
  };

  // Save immutable snapshot
  await setDoc(doc(db, "employee_performance", perfId), perfData);

  return perfData;
};

export const getPerformanceByPeriod = async (periodId: string): Promise<EmployeePerformance[]> => {
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(collection(db, "employee_performance"), where("month", "==", periodId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as EmployeePerformance);
};
