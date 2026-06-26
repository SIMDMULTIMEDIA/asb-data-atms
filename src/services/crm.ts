import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Customer, CustomerInteraction, CustomerRating, CustomerComplaint, CustomerNote } from "@/types";

// ==========================================
// Customers
// ==========================================

export const generateCustomerNumber = (): string => {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `ASB-CUS-${year}-${randomStr}`;
};

export const createCustomer = async (data: Omit<Customer, "id" | "customerNumber" | "createdAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in createCustomer");
    return "";
  }
  const customerId = doc(collection(db, "customers")).id;
  const customerNumber = generateCustomerNumber();
  
  const customerData: Customer = {
    ...data,
    id: customerId,
    customerNumber,
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "customers", customerId), customerData);
  return customerId;
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateCustomer");
    return ;
  }
  await updateDoc(doc(db, "customers", customerId), {
    ...data,
    updatedAt: Timestamp.now()
  });
};

// ==========================================
// Interactions
// ==========================================

export const addCustomerInteraction = async (data: Omit<CustomerInteraction, "id" | "createdAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in addCustomerInteraction");
    return "";
  }
  const interactionId = doc(collection(db, "customer_interactions")).id;
  
  const interactionData: CustomerInteraction = {
    ...data,
    id: interactionId,
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "customer_interactions", interactionId), interactionData);
  return interactionId;
};

// ==========================================
// Ratings
// ==========================================

export const submitCustomerRating = async (data: Omit<CustomerRating, "id" | "createdAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in submitCustomerRating");
    return "";
  }
  const ratingId = doc(collection(db, "customer_ratings")).id;
  
  const ratingData: CustomerRating = {
    ...data,
    id: ratingId,
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "customer_ratings", ratingId), ratingData);
  return ratingId;
};

// ==========================================
// Complaints
// ==========================================

export const generateComplaintNumber = (): string => {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `ASB-CMP-${year}-${randomStr}`;
};

export const createCustomerComplaint = async (data: Omit<CustomerComplaint, "id" | "complaintNumber" | "createdAt" | "updatedAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in createCustomerComplaint");
    return "";
  }
  const complaintId = doc(collection(db, "customer_complaints")).id;
  const complaintNumber = generateComplaintNumber();
  
  const complaintData: CustomerComplaint = {
    ...data,
    id: complaintId,
    complaintNumber,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "customer_complaints", complaintId), complaintData);
  return complaintId;
};

export const updateComplaint = async (complaintId: string, data: Partial<CustomerComplaint>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateComplaint");
    return ;
  }
  await updateDoc(doc(db, "customer_complaints", complaintId), {
    ...data,
    updatedAt: Timestamp.now()
  });
};

// ==========================================
// Notes
// ==========================================

export const addCustomerNote = async (data: Omit<CustomerNote, "id" | "createdAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in addCustomerNote");
    return "";
  }
  const noteId = doc(collection(db, "customer_notes")).id;
  
  const noteData: CustomerNote = {
    ...data,
    id: noteId,
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "customer_notes", noteId), noteData);
  return noteId;
};
