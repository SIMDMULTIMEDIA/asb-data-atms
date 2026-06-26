import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Task, TaskComment } from "@/types";

export const generateTaskNumber = (): string => {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `ASB-TSK-${year}-${randomStr}`;
};

export const createTask = async (data: Omit<Task, "id" | "taskNumber" | "createdAt" | "updatedAt">): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in createTask");
    return "";
  }
  const taskId = doc(collection(db, "tasks")).id;
  const taskNumber = generateTaskNumber();
  
  const taskData: Task = {
    ...data,
    id: taskId,
    taskNumber,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(doc(db, "tasks", taskId), taskData);
  return taskId;
};

export const updateTask = async (taskId: string, data: Partial<Task>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in updateTask");
    return ;
  }
  await updateDoc(doc(db, "tasks", taskId), {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const addTaskComment = async (taskId: string, userId: string, text: string): Promise<string> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in addTaskComment");
    return "";
  }
  const commentRef = doc(collection(db, "task_comments"));
  const comment: TaskComment = {
    id: commentRef.id,
    taskId,
    userId,
    text,
    createdAt: Timestamp.now()
  };
  await setDoc(commentRef, comment);
  return commentRef.id;
};
