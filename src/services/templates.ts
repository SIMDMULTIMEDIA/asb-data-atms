import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { ReportTemplate } from "@/types";

const INITIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: "developer_daily",
    department: "developer",
    reportType: "daily_report",
    title: "Developer Daily Report",
    approvalRequired: true,
    kpiWeight: 20,
    fields: [
      { name: "projectName", label: "Project Name", type: "text", required: true },
      { name: "taskCompleted", label: "Task Completed", type: "textarea", required: true },
      { name: "bugsFixed", label: "Bugs Fixed", type: "number", required: false },
      { name: "deploymentStatus", label: "Deployment Status", type: "select", required: true, options: ["Pending", "Deployed", "Failed", "Not Applicable"] }
    ]
  },
  {
    id: "marketing_lead",
    department: "marketing",
    reportType: "lead_generation",
    title: "Lead Generation Report",
    approvalRequired: true,
    kpiWeight: 20,
    fields: [
      { name: "campaignName", label: "Campaign Name", type: "text", required: true },
      { name: "leadsGenerated", label: "Leads Generated", type: "number", required: true },
      { name: "budgetSpent", label: "Budget Spent ($)", type: "number", required: true },
      { name: "notes", label: "Notes", type: "textarea", required: false }
    ]
  },
  {
    id: "customer_care_shift",
    department: "customer_care",
    reportType: "shift_report",
    title: "Customer Care Shift Report",
    approvalRequired: true,
    kpiWeight: 15,
    fields: [
      { name: "callsAnswered", label: "Calls Answered", type: "number", required: true },
      { name: "complaintsResolved", label: "Complaints Resolved", type: "number", required: true },
      { name: "averageHandlingTime", label: "Avg Handling Time (mins)", type: "number", required: true },
      { name: "escalations", label: "Escalations", type: "number", required: false }
    ]
  }
];

export const seedTemplates = async () => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firestore unavailable in seedTemplates");
    return null;
  }
  try {
    for (const template of INITIAL_TEMPLATES) {
      await setDoc(doc(db, "report_templates", template.id), template);
    }
    console.log("Templates seeded successfully");
    return true;
  } catch (error) {
    console.error("Failed to seed templates:", error);
    return false;
  }
};
