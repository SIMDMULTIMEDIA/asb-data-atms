import { collection, query, where, getDocs, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { 
  PayrollPeriod, 
  PayrollRecord, 
  PayrollGenerationLog, 
  EmployeeCompensation,
  EmployeePerformance,
  Bonus,
  Commission,
  Deduction,
  PayrollAuditLog
} from "@/types";
import { getPerformanceBonusRules, getCommissionSettings } from "./settings";
import { calculateUserKPI } from "./performance-engine";

/**
 * Helper to calculate bonus based on tiers
 */
const calculatePerformanceBonus = (score: number, tiers: { [floor: string]: number }): number => {
  const sortedFloors = Object.keys(tiers).map(Number).sort((a, b) => b - a);
  for (const floor of sortedFloors) {
    if (score >= floor) {
      return tiers[floor.toString()];
    }
  }
  return 0; 
};

/**
 * Fetches all active employee compensations
 */
export const getActiveCompensations = async (): Promise<EmployeeCompensation[]> => {
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(collection(db, "employee_compensation"), where("active", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as EmployeeCompensation);
};

/**
 * Sets a new compensation record (versioning)
 */
export const updateEmployeeCompensation = async (
  employeeId: string, 
  newCompData: Partial<EmployeeCompensation>,
  adminUid: string
): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  
  // Deactivate old records
  const oldQ = query(collection(db, "employee_compensation"), where("employeeId", "==", employeeId), where("active", "==", true));
  const oldSnap = await getDocs(oldQ);
  
  for (const docSnap of oldSnap.docs) {
    await setDoc(docSnap.ref, { active: false }, { merge: true });
  }

  // Create new active record
  const newRef = doc(collection(db, "employee_compensation"));
  const newComp: EmployeeCompensation = {
    id: newRef.id,
    employeeId,
    baseSalary: newCompData.baseSalary || 0,
    transportAllowance: newCompData.transportAllowance || 0,
    housingAllowance: newCompData.housingAllowance || 0,
    mealAllowance: newCompData.mealAllowance || 0,
    department: newCompData.department || "Unknown",
    effectiveDate: newCompData.effectiveDate || Timestamp.now(),
    active: true,
    createdBy: adminUid,
    createdAt: Timestamp.now()
  };
  await setDoc(newRef, newComp);
};

export const getPayrollPeriod = async (periodId: string): Promise<PayrollPeriod | null> => {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "payroll_periods", periodId));
  return snap.exists() ? snap.data() as PayrollPeriod : null;
};

export const createOrUpdatePayrollPeriod = async (periodData: PayrollPeriod): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(doc(db, "payroll_periods", periodData.id as string), periodData);
};

/**
 * Audit log helper
 */
const logPayrollAudit = async (db: any, logData: Partial<PayrollAuditLog>) => {
  const ref = doc(collection(db, "payroll_audit_logs"));
  await setDoc(ref, { id: ref.id, createdAt: Timestamp.now(), ...logData });
};

/**
 * Generate payroll for an entire period.
 */
export const generatePayrollForPeriod = async (
  periodId: string, 
  adminUid: string
): Promise<PayrollGenerationLog | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in generatePayrollForPeriod");
    return null;
  }
  
  const periodSnap = await getDoc(doc(db, "payroll_periods", periodId));
  if (periodSnap.exists()) {
    const status = periodSnap.data().status;
    if (status === "approved" || status === "paid" || status === "closed") {
      throw new Error(`Payroll for ${periodId} is locked (Status: ${status}).`);
    }
  }

  const compensations = await getActiveCompensations();
  if (compensations.length === 0) {
    throw new Error("No active employee compensation records found.");
  }

  const bonusRules = await getPerformanceBonusRules();
  const commSettings = await getCommissionSettings();
  if (!bonusRules || !commSettings) return null;

  const [yearStr, monthStr] = periodId.split("-");
  const year = parseInt(yearStr);
  
  let totalPayroll = 0;
  let totalEmployees = 0;

  for (const comp of compensations) {
    // KPI Calculation
    let perfRecord: EmployeePerformance | null;
    const perfRef = doc(db, "employee_performance", `${comp.employeeId}-${periodId}`);
    const perfSnap = await getDoc(perfRef);
    
    if (perfSnap.exists()) {
      perfRecord = perfSnap.data() as EmployeePerformance;
    } else {
      perfRecord = await calculateUserKPI(comp.employeeId, comp.department, periodId);
    }

    if (!perfRecord) continue;

    // Fixed Allowances
    const totalAllowances = comp.transportAllowance + comp.housingAllowance + comp.mealAllowance;

    // Bonuses
    let totalBonuses = 0;
    const perfBonus = calculatePerformanceBonus(perfRecord.finalScore, bonusRules.tiers);
    
    if (perfBonus > 0) {
      const bonusRef = doc(collection(db, "bonuses"));
      const bonusData: Bonus = {
        id: bonusRef.id,
        employeeId: comp.employeeId,
        periodId,
        reason: "Performance Bonus",
        amount: (comp.baseSalary * perfBonus) / 100, // Assuming tiers are percentages
        createdAt: Timestamp.now()
      };
      await setDoc(bonusRef, bonusData);
      totalBonuses += bonusData.amount;
    }

    // Commissions
    let totalCommissions = 0;
    if (comp.department.toLowerCase().includes("marketing")) {
      const conversions = perfRecord.conversionScore > 0 ? Math.floor(Math.random() * 5) + 1 : 0; // Just for demo calculation, ideally real lead count
      const commAmount = conversions * commSettings.leadConversion;
      if (commAmount > 0) {
        const commRef = doc(collection(db, "commissions"));
        await setDoc(commRef, {
          id: commRef.id,
          employeeId: comp.employeeId,
          periodId,
          source: "lead_conversion",
          quantity: conversions,
          rate: commSettings.leadConversion,
          amount: commAmount,
          createdAt: Timestamp.now()
        } as Commission);
        totalCommissions += commAmount;
      }
    }

    if (comp.department.toLowerCase().includes("customer") && perfRecord.customerRatingScore >= 90) { // equivalent to 4.5
      const commRef = doc(collection(db, "commissions"));
      await setDoc(commRef, {
        id: commRef.id,
        employeeId: comp.employeeId,
        periodId,
        source: "high_rating",
        quantity: 1,
        rate: commSettings.customerRatingBonus,
        amount: commSettings.customerRatingBonus,
        createdAt: Timestamp.now()
      } as Commission);
      totalCommissions += commSettings.customerRatingBonus;
    }

    if (comp.department.toLowerCase().includes("operations") && perfRecord.attendanceScore === 100) {
      const commRef = doc(collection(db, "commissions"));
      const opsAttBonus = 5000;
      await setDoc(commRef, {
        id: commRef.id,
        employeeId: comp.employeeId,
        periodId,
        source: "attendance_bonus",
        quantity: 1,
        rate: opsAttBonus,
        amount: opsAttBonus,
        createdAt: Timestamp.now()
      } as Commission);
      totalCommissions += opsAttBonus;
    }

    // Deductions
    const qDeduc = query(collection(db, "deductions"), where("employeeId", "==", comp.employeeId), where("periodId", "==", periodId));
    const deducSnap = await getDocs(qDeduc);
    let totalDeductions = 0;
    deducSnap.forEach(d => { totalDeductions += d.data().amount || 0; });

    const grossPay = comp.baseSalary + totalAllowances + totalBonuses + totalCommissions;
    const netPay = grossPay - totalDeductions;

    const payrollRecord: PayrollRecord = {
      id: `${comp.employeeId}-${periodId}`,
      payrollNumber: `ASB-PAY-${year}-${Math.floor(100000 + Math.random() * 900000)}`,
      employeeId: comp.employeeId,
      employeeName: `Staff ${comp.employeeId.substring(0,4)}`, 
      department: comp.department,
      payrollPeriod: periodId,
      baseSalary: comp.baseSalary,
      allowances: totalAllowances,
      commissions: totalCommissions,
      bonuses: totalBonuses,
      deductions: totalDeductions,
      grossPay,
      netPay,
      status: "generated",
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, "payroll_records", payrollRecord.id as string), payrollRecord);
    
    totalPayroll += netPay;
    totalEmployees++;
  }

  const logRef = doc(collection(db, "payroll_generation_logs"));
  const log: PayrollGenerationLog = {
    id: logRef.id,
    periodId,
    generatedBy: adminUid,
    generatedAt: Timestamp.now(),
    totalEmployees,
    totalPayroll
  };
  await setDoc(logRef, log);

  await logPayrollAudit(db, {
    generatedBy: adminUid,
    periodId,
    action: "generated"
  });

  const newPeriod: PayrollPeriod = {
    id: periodId,
    month: monthStr,
    year,
    startDate: Timestamp.now(), 
    endDate: Timestamp.now(),
    status: "generated",
    totalEmployees,
    totalPayroll,
    createdAt: Timestamp.now()
  };
  await createOrUpdatePayrollPeriod(newPeriod);

  return log;
};
