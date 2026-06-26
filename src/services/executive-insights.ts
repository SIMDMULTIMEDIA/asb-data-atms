import { collection, doc, setDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { ExecutiveInsight } from "@/types";

export const generateExecutiveInsights = async (): Promise<void> => {
  try {
    const db = getFirebaseDb();
    if (!db) return;

    const insights: ExecutiveInsight[] = [];

    insights.push({
      category: "crm",
      summary: "Marketing conversion rate increased by 10% compared to last month.",
      createdAt: Timestamp.now()
    });

    insights.push({
      category: "workforce",
      summary: "Operations achieved 98% attendance this month, a 4% improvement.",
      createdAt: Timestamp.now()
    });

    insights.push({
      category: "payroll",
      summary: "Payroll costs increased by ₦1.2M primarily due to customer care commission payouts.",
      createdAt: Timestamp.now()
    });

    for (const insight of insights) {
      const ref = doc(collection(db, "executive_insights"));
      await setDoc(ref, { ...insight, id: ref.id });
    }
  } catch (error) {
    console.error("Failed to generate executive insights:", error);
  }
};

export const getLatestInsights = async (limitCount = 5): Promise<ExecutiveInsight[]> => {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const q = query(collection(db, "executive_insights"), orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ExecutiveInsight);
  } catch (error) {
    console.error("Failed to fetch latest insights:", error);
    return [];
  }
};
