import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { Department } from "@/types";

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "developer",
    name: "Developer",
    reportRequired: true,
    attendanceRequired: true,
    approvalRequired: true,
    templates: ["daily_report", "bug_fix_report", "deployment_report", "upgrade_report"],
  },
  {
    id: "marketing",
    name: "Marketing",
    reportRequired: true,
    attendanceRequired: true,
    approvalRequired: true,
    templates: ["lead_generation_report", "customer_acquisition_report", "contract_acquisition_report"],
  },
  {
    id: "customer_care",
    name: "Customer Care",
    reportRequired: true,
    attendanceRequired: true,
    approvalRequired: true,
    templates: ["shift_report", "complaint_resolution_report", "customer_satisfaction_report"],
  },
  {
    id: "automation",
    name: "Automation",
    reportRequired: true,
    attendanceRequired: false,
    approvalRequired: false,
    templates: ["automation_activity_report", "ai_operations_report", "integration_report"],
  },
  {
    id: "administration",
    name: "Administration",
    reportRequired: false,
    attendanceRequired: true,
    approvalRequired: false,
    templates: [],
  }
];

export const seedDepartments = async () => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in seedDepartments");
    return null;
  }
  try {
    for (const dept of INITIAL_DEPARTMENTS) {
      await setDoc(doc(db, "departments", dept.id), dept);
    }
    console.log("Departments seeded successfully");
    return true;
  } catch (error) {
    console.error("Failed to seed departments:", error);
    return false;
  }
};
