import { collection, doc, setDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { EmployeePerformance, SystemAlert } from "@/types";

export const generateWorkforceRiskAlerts = async (perf: EmployeePerformance): Promise<void> => {
  try {
    const db = getFirebaseDb();
    if (!db) return;

    const alerts: SystemAlert[] = [];

    if (perf.finalScore < 50) {
      alerts.push({
        type: "high_risk_employee",
        severity: "high",
        message: `High Risk Employee: ${perf.userId} has a KPI of ${perf.finalScore}% in ${perf.department}.`,
        resolved: false,
        createdAt: Timestamp.now()
      });
    }

    if (perf.attendanceScore < 60) {
      alerts.push({
        type: "low_attendance",
        severity: "medium",
        message: `Attendance Concern: ${perf.userId} attendance is at ${perf.attendanceScore}%.`,
        resolved: false,
        createdAt: Timestamp.now()
      });
    }

    if (perf.taskScore < 50) {
      alerts.push({
        type: "kpi_drop",
        severity: "medium",
        message: `Productivity Decline: ${perf.userId} task completion is at ${perf.taskScore}%.`,
        resolved: false,
        createdAt: Timestamp.now()
      });
    }

    for (const alert of alerts) {
      const alertId = `${alert.type}_${perf.userId}_${perf.month}`;
      await setDoc(doc(db, "system_alerts", alertId), { ...alert, id: alertId });
    }
  } catch (error) {
    console.error("Failed to generate workforce risk alerts:", error);
  }
};
