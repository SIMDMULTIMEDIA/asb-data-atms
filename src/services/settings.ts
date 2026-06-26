import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { CompanySettings, KPIWeights, CommissionSettings, PerformanceBonusRules } from "@/types";

// ==========================================
// Default Settings Fallbacks
// ==========================================

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  currency: "NGN",
  currencySymbol: "₦",
  country: "Nigeria",
  updatedAt: Timestamp.now()
};

export const DEFAULT_KPI_WEIGHTS: KPIWeights = {
  attendance: 25,
  reports: 25,
  tasks: 20,
  customerRating: 15,
  leadConversion: 15,
  updatedAt: Timestamp.now()
};

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  leadConversion: 2000,
  customerRatingBonus: 500,
  updatedAt: Timestamp.now()
};

export const DEFAULT_BONUS_RULES: PerformanceBonusRules = {
  tiers: {
    "60": 5000,
    "70": 10000,
    "80": 20000,
    "90": 30000
  },
  updatedAt: Timestamp.now()
};

// ==========================================
// Getters
// ==========================================

export const getCompanySettings = async (): Promise<CompanySettings | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getCompanySettings");
    return null;
  }
  const docRef = doc(db, "settings", "company");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as CompanySettings;
  return DEFAULT_COMPANY_SETTINGS;
};

export const getKPIWeights = async (): Promise<KPIWeights | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getKPIWeights");
    return null;
  }
  const docRef = doc(db, "settings", "kpi");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as KPIWeights;
  return DEFAULT_KPI_WEIGHTS;
};

export const getCommissionSettings = async (): Promise<CommissionSettings | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getCommissionSettings");
    return null;
  }
  const docRef = doc(db, "settings", "commission");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as CommissionSettings;
  return DEFAULT_COMMISSION_SETTINGS;
};

export const getPerformanceBonusRules = async (): Promise<PerformanceBonusRules | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getPerformanceBonusRules");
    return null;
  }
  const docRef = doc(db, "settings", "performance_bonus");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as PerformanceBonusRules;
  return DEFAULT_BONUS_RULES;
};

// ==========================================
// Setters
// ==========================================

export const updateCompanySettings = async (data: Partial<CompanySettings>) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateCompanySettings");
    return null;
  }
  await setDoc(doc(db, "settings", "company"), { ...data, updatedAt: Timestamp.now() }, { merge: true });
};

export const updateKPIWeights = async (data: Partial<KPIWeights>) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateKPIWeights");
    return null;
  }
  await setDoc(doc(db, "settings", "kpi"), { ...data, updatedAt: Timestamp.now() }, { merge: true });
};

export const updateCommissionSettings = async (data: Partial<CommissionSettings>) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateCommissionSettings");
    return null;
  }
  await setDoc(doc(db, "settings", "commission"), { ...data, updatedAt: Timestamp.now() }, { merge: true });
};

export const updatePerformanceBonusRules = async (data: Partial<PerformanceBonusRules>) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updatePerformanceBonusRules");
    return null;
  }
  await setDoc(doc(db, "settings", "performance_bonus"), { ...data, updatedAt: Timestamp.now() }, { merge: true });
};
