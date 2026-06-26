import { collection, doc, setDoc, addDoc, Timestamp, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Report, ReportVersion } from "@/types";
import { openDB } from "idb";

// IndexedDB Setup for Offline Drafts
const DB_NAME = "asb_data_atms";
const STORE_NAME = "offline_drafts";

export const initDB = async () => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in initDB");
    return null;
  }
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
};

export const saveOfflineDraft = async (report: Partial<Report> & { id: string }) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in saveOfflineDraft");
    return null;
  }
  try {
    const idb = await initDB();
    if (!idb) throw new Error("IndexedDB init failed");
    await idb.put(STORE_NAME, { ...report, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Failed to save offline draft:", error);
    return false;
  }
};

export const getOfflineDrafts = async () => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getOfflineDrafts");
    return null;
  }
  try {
    const idb = await initDB();
    if (!idb) return [];
    return await idb.getAll(STORE_NAME);
  } catch (error) {
    console.error("Failed to get offline drafts:", error);
    return [];
  }
};

export const deleteOfflineDraft = async (id: string) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in deleteOfflineDraft");
    return null;
  }
  try {
    const idb = await initDB();
    if (!idb) return false;
    await idb.delete(STORE_NAME, id);
    return true;
  } catch (error) {
    console.error("Failed to delete offline draft:", error);
    return false;
  }
};

// Firestore Submission Logic
export const generateReportNumber = () => {
  // Format: ASB-RPT-YYYY-XXXXXX
  const year = new Date().getFullYear();
  const randomStr = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ASB-RPT-${year}-${randomStr}`;
};

export const submitReport = async (reportData: Omit<Report, "id" | "createdAt" | "updatedAt">) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in submitReport");
    return null;
  }
  try {
    const reportRef = doc(collection(db, "reports"));
    const report: Report = {
      ...reportData,
      id: reportRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(reportRef, report);
    
    // Log initial version
    await saveReportVersion(report.id, 1, report.userId, report.data);
    
    return report;
  } catch (error) {
    console.error("Failed to submit report:", error);
    throw error;
  }
};

export const saveReportVersion = async (reportId: string, version: number, changedBy: string, snapshot: Record<string, any>) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in saveReportVersion");
    return null;
  }
  try {
    const versionData: ReportVersion = {
      reportId,
      version,
      changedBy,
      snapshot,
      createdAt: Timestamp.now(),
    };
    await addDoc(collection(db, "report_versions"), versionData);
  } catch (error) {
    console.error("Failed to save report version:", error);
  }
};

export const updateReport = async (reportId: string, updates: Partial<Report>, changedBy: string) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateReport");
    return null;
  }
  try {
    const reportRef = doc(db, "reports", reportId);
    
    const currentDoc = await getDoc(reportRef);
    if (!currentDoc.exists()) throw new Error("Report not found");
    
    await setDoc(reportRef, { ...updates, updatedAt: Timestamp.now() }, { merge: true });
    
    if (updates.data) {
      // Simplification: In real enterprise app, query max version first
      await saveReportVersion(reportId, Date.now(), changedBy, updates.data);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to update report:", error);
    throw error;
  }
};
