import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Attendance, CompanyLocation } from "@/types";

// Haversine formula to calculate distance in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

export const getActiveLocations = async (): Promise<CompanyLocation[]> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in getActiveLocations");
    return [];
  }
  const q = query(collection(db, "company_locations"), where("active", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyLocation));
};

export const checkActiveAttendance = async (userId: string): Promise<Attendance | null> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in checkActiveAttendance");
    return null;
  }
  const q = query(
    collection(db, "attendance"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  
  // Filter for records without a checkout
  const activeRecords = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Attendance))
    .filter(record => !record.checkOut);
    
  // Sort descending by checkIn if there are somehow multiple, return the latest active
  activeRecords.sort((a, b) => b.checkIn.toMillis() - a.checkIn.toMillis());
    
  return activeRecords.length > 0 ? activeRecords[0] : null;
};

export const submitCheckIn = async (data: Omit<Attendance, "id" | "createdAt" | "selfieUrl">, selfieBlob: Blob): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in submitCheckIn");
    return "";
  }
  // Prevent duplicate
  const active = await checkActiveAttendance(data.userId);
  if (active) throw new Error("Already checked in");

  const attendanceId = `ATT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const attendanceData: Attendance = {
    ...data,
    id: attendanceId,
    selfieUrl: "metadata_only",
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "attendance", attendanceId), attendanceData);
  
  return attendanceId;
};

export const submitCheckOut = async (attendanceId: string, statusOverride?: Attendance["status"]): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in submitCheckOut");
    return ;
  }
  const updateData: any = {
    checkOut: Timestamp.now()
  };
  
  if (statusOverride) {
    updateData.status = statusOverride;
  }
  
  await updateDoc(doc(db, "attendance", attendanceId), updateData);
};
