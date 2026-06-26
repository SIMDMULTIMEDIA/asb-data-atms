import { doc, getDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { AppSettings, KPIScore } from "@/types";

export const getAppSettings = async (): Promise<AppSettings | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getAppSettings");
    return null;
  }
  const docRef = doc(db, "settings", "global");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AppSettings;
  }
  return {
    attendanceWeight: 30,
    reportWeight: 40,
    taskWeight: 30,
  };
};

export const calculateEmployeeKPI = async (userId: string, month: string): Promise<KPIScore | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in calculateEmployeeKPI");
    return null;
  }
  const settings = await getAppSettings();
  if (!settings) return null;
  
  // Future: query reports, attendance, and tasks collections for the specific month to calculate actual score
  // For now, we mock the scores based on the weights.
  const attendanceScore = 100; // Mock 100%
  const reportScore = 100; // Mock 100%
  const taskScore = 100; // Mock 100%
  
  const finalScore = (attendanceScore * (settings.attendanceWeight / 100)) + 
                       (reportScore * (settings.reportWeight / 100)) +
                       (taskScore * (settings.taskWeight / 100));
                   
  return {
    userId,
    month,
    attendanceScore,
    reportScore,
    taskScore,
    finalScore,
    updatedAt: Timestamp.now()
  };
};
