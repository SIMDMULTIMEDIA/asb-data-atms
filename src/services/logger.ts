import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { AuditLog } from "@/types";

export const logActivity = async (
  userId: string,
  action: string,
  department: string,
  deviceInfo?: string
) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in logActivity");
    return null;
  }
  try {
    // Attempt to get basic device info if running in a browser
    const parsedDeviceInfo = deviceInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : "Unknown Device");
    
    const logData: AuditLog = {
      userId,
      action,
      department,
      deviceInfo: parsedDeviceInfo,
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : "Unknown",
      operatingSystem: "Unknown", // Can be parsed from userAgent later
      location: "Unknown", // Can be fetched via geolocation API later
      timestamp: Timestamp.now(),
    };
    
    await addDoc(collection(db, "audit_logs"), logData);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
