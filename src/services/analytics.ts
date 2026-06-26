import { doc, getDoc, setDoc, Timestamp, collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { AnalyticsMetadata } from "@/types";
import { generateExecutiveInsights } from "./executive-insights";
import { generateWorkforceRiskAlerts } from "./alerts";

/**
 * Ensures insights and alerts are only generated once every 6 hours
 * to keep the dashboard fast and prevent spamming Firestore.
 */
export const checkAndGenerateAnalytics = async (adminUid: string): Promise<void> => {
  try {
    const db = getFirebaseDb();
    if (!db) return;

    const metaRef = doc(db, "analytics_metadata", "global");
    const metaSnap = await getDoc(metaRef);
    
    let shouldGenerate = false;
    if (!metaSnap.exists()) {
      shouldGenerate = true;
    } else {
      const data = metaSnap.data() as AnalyticsMetadata;
      const hoursSinceLast = (Timestamp.now().toMillis() - data.lastGeneratedAt.toMillis()) / (1000 * 60 * 60);
      if (hoursSinceLast > 6) {
        shouldGenerate = true;
      }
    }

    if (shouldGenerate) {
      // Run generation logic
      await generateExecutiveInsights();
      
      // We can also trigger risk alerts here based on recent performance
      const perfSnap = await getDocs(collection(db, "employee_performance"));
      for (const d of perfSnap.docs) {
        await generateWorkforceRiskAlerts(d.data() as any);
      }

      // Update metadata
      await setDoc(metaRef, {
        id: "global",
        lastGeneratedAt: Timestamp.now(),
        generatedBy: adminUid
      } as AnalyticsMetadata);
    }
  } catch (error) {
    console.error("Failed to check and generate analytics:", error);
  }
};

/**
 * Fetches High-Level KPI Scorecard data
 */
export const getExecutiveScorecard = async () => {
  const defaultScorecard = {
    totalEmployees: 0,
    activeEmployees: 0,
    avgAttendance: 0,
    avgKPI: 0,
    customerSatisfaction: 0,
    leadConversion: 0,
    totalPayrollCost: 0,
    profitEstimate: 0,
    revenueGenerated: 0
  };

  try {
    const db = getFirebaseDb();
    if (!db) return defaultScorecard;

    // Real app: complex queries or pre-aggregated document.
    // For Phase 7 demo, we aggregate some available data.
    const usersSnap = await getDocs(collection(db, "users"));
    const totalEmployees = usersSnap.size;

    const recordsSnap = await getDocs(collection(db, "payroll_records"));
    let totalPayrollCost = 0;
    recordsSnap.docs.forEach(d => totalPayrollCost += d.data().netPay || 0);

    const perfSnap = await getDocs(collection(db, "employee_performance"));
    let totalKPI = 0;
    let totalAttendance = 0;
    let count = 0;
    perfSnap.docs.forEach(d => {
      totalKPI += d.data().finalScore || 0;
      totalAttendance += d.data().attendanceScore || 0;
      count++;
    });

    const avgKPI = count > 0 ? Math.round(totalKPI / count) : 0;
    const avgAttendance = count > 0 ? Math.round(totalAttendance / count) : 0;

    // Fake revenue metrics for UI layout showcase
    const revenueGenerated = 45000000;
    const profitEstimate = revenueGenerated - totalPayrollCost;

    return {
      totalEmployees,
      activeEmployees: totalEmployees, // assuming all active for now
      avgAttendance,
      avgKPI,
      customerSatisfaction: 94, // demo
      leadConversion: 68, // demo
      totalPayrollCost,
      profitEstimate,
      revenueGenerated
    };
  } catch (error) {
    console.error("Failed to fetch executive scorecard:", error);
    return defaultScorecard;
  }
};
