import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let appInstance: ReturnType<typeof getApp> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let warningShown = false;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

if (typeof window !== "undefined" && !warningShown) {
  console.info("Firebase Config Loaded:", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
}

export function getFirebaseApp() {
  if (typeof window === "undefined") return null;

  if (!firebaseConfig.apiKey) {
    if (!warningShown) {
      console.warn("Firebase configuration missing");
      warningShown = true;
    }
    return null;
  }

  if (!appInstance) {
    appInstance =
      getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig);
  }

  return appInstance;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return authInstance;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }

  return dbInstance;
}
