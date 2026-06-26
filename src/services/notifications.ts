import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Notification } from "@/types";

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification["type"],
  priority: Notification["priority"] = "medium"
) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in sendNotification");
    return null;
  }
  try {
    const notification: Notification = {
      userId,
      title,
      message,
      readStatus: false,
      type,
      priority,
      createdAt: Timestamp.now(),
    };
    
    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};
