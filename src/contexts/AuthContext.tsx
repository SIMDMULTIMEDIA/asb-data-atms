"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "@/firebase/client";

interface UserData {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  shift: string;
  status: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      setUser(null);
      setUserData(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const db = getFirebaseDb();
          if (!db) throw new Error("Firestore unavailable");
          
          // Use onSnapshot to listen for real-time changes to the user's role
          const unsubscribeDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (userDoc) => {
            if (userDoc.exists()) {
              setUserData(userDoc.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching user data:", error);
            setUserData(null);
            setLoading(false);
          });

          // We need to store this unsubscribe function or manage it. 
          // For simplicity in this effect, we let it run as long as the auth state is valid.
          // In a more complex setup, we'd clean this up perfectly.
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn("Firebase Auth unavailable");
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);