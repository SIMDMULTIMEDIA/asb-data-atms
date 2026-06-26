import { Timestamp } from "firebase/firestore";

export type Role = 
  | "super_admin" 
  | "admin" 
  | "department_head"
  | "developer" 
  | "marketer_adhoc" 
  | "marketer_contract" 
  | "customer_care" 
  | "automation";

export type ReportStatus = "draft" | "submitted" | "under_review" | "correction_requested" | "approved" | "rejected";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
  shift: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  reportRequired: boolean;
  attendanceRequired: boolean;
  approvalRequired: boolean;
  templates: string[]; // Still keeps a list of template IDs for reference
}

export interface ReportTemplateField {
  name: string;
  type: "text" | "textarea" | "number" | "email" | "phone" | "date" | "time" | "select" | "multiselect" | "checkbox" | "radio" | "file";
  label: string;
  required: boolean;
  options?: string[]; // For select/radio/multiselect
}

export interface ReportTemplate {
  id: string;
  department: string;
  reportType: string;
  title: string;
  approvalRequired: boolean;
  kpiWeight: number;
  fields: ReportTemplateField[];
}

export interface Report {
  id: string;
  reportNumber: string;
  userId: string;
  department: string;
  reportType: string;
  shift: string;
  status: ReportStatus;
  data: Record<string, any>;
  attachments?: string[];
  deadlineAt?: Timestamp | null;
  submittedLate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReportVersion {
  id?: string;
  reportId: string;
  version: number;
  changedBy: string;
  snapshot: Record<string, any>;
  createdAt: Timestamp;
}

export interface ReportApproval {
  id?: string;
  reportId: string;
  approvedBy: string;
  decision: "approved" | "rejected" | "correction_requested";
  comment: string;
  timestamp: Timestamp;
}

export interface AuditLog {
  logId?: string;
  userId: string;
  action: string;
  department: string;
  deviceInfo: string;
  browser: string;
  operatingSystem: string;
  location: string;
  timestamp: Timestamp;
}

export interface Notification {
  notificationId?: string;
  userId: string; // Target user
  title: string;
  message: string;
  readStatus: boolean;
  type: "report" | "attendance" | "task" | "announcement" | "system";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Timestamp;
}

export interface ActivityFeed {
  feedId?: string;
  userId: string;
  userName: string;
  department: string;
  action: string;
  type: "report_created" | "report_submitted" | "report_approved" | "report_rejected" | "report_corrected" | "attendance_checkin" | "attendance_checkout" | "task_created" | "task_assigned" | "task_started" | "task_reviewed" | "task_completed" | "task_approved" | "task_cancelled";
  timestamp: Timestamp;
}

export interface CompanyLocation {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  active: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  reportNumber?: string; // Optional if not linked immediately
  shift: string;
  status: "present" | "late" | "early_checkout" | "absent";
  location: {
    latitude: number;
    longitude: number;
  };
  selfieUrl: string;
  checkIn: Timestamp;
  checkOut?: Timestamp;
  deviceInfo: {
    browser: string;
    operatingSystem: string;
    platform: string;
  };
  createdAt: Timestamp;
}

export interface AppSettings {
  id?: string; // Usually a single doc 'global'
  attendanceWeight: number;
  reportWeight: number;
  taskWeight: number;
}

export type TaskStatus = "draft" | "assigned" | "in_progress" | "under_review" | "revision_requested" | "completed" | "approved" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskVisibility = "private" | "department" | "public_department";

export interface Task {
  id: string;
  taskNumber: string; // e.g., ASB-TSK-2026-000001
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  visibility: TaskVisibility;
  assignedTo: {
    type: "individual" | "department" | "multiple";
    assignees: string[]; // User IDs or Department IDs
  };
  createdBy: string; // User ID of assigner
  dueDate: Timestamp;
  progress: number; // 0-100
  estimatedHours?: number;
  actualHours?: number;
  reviewNotes?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskComment {
  id?: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

export interface TaskAttachment {
  id?: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileData?: string;
  createdAt: Timestamp;
}

export interface KPIScore {
  id?: string;
  userId: string;
  month: string; // YYYY-MM
  attendanceScore: number;
  reportScore: number;
  taskScore: number;
  finalScore: number;
  updatedAt: Timestamp;
}

export interface DepartmentRanking {
  id?: string;
  departmentId: string;
  month: string;
  attendanceScore: number;
  reportScore: number;
  taskScore: number;
  finalScore: number;
  rank: number;
  updatedAt: Timestamp;
}

// ==========================================
// Phase 5: CRM Models
// ==========================================

export interface Customer {
  id: string;
  customerNumber: string; // e.g. ASB-CUS-2026-000001
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  source: "marketing" | "referral" | "walk_in" | "website";
  assignedTo?: string; // Staff UID
  status: "lead" | "active" | "inactive";
  createdAt: Timestamp;
}

export interface CustomerInteraction {
  id?: string;
  customerId: string;
  staffId: string;
  type: "call" | "meeting" | "message" | "visit" | "email";
  outcome: "lead_created" | "contacted" | "converted" | "lost";
  notes: string;
  createdAt: Timestamp;
}

export interface CustomerRating {
  id?: string;
  customerId?: string; // Optional if public rating
  staffId: string;
  rating: number; // 1 to 5
  comment?: string;
  source: "staff_entry" | "customer_public";
  createdAt: Timestamp;
}

export interface CustomerComplaint {
  id?: string;
  complaintNumber: string; // e.g. ASB-CMP-2026-000001
  customerId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  assignedDepartment: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CustomerNote {
  id?: string;
  customerId: string;
  staffId: string;
  note: string;
  createdAt: Timestamp;
}

// ==========================================
// Phase 6: Payroll & Performance Models
// ==========================================

export interface EmployeeCompensation {
  id?: string;
  employeeId: string; // Used to be userId, keeping employeeId per spec
  baseSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  mealAllowance: number;
  department: string;
  effectiveDate: Timestamp;
  active: boolean; // For versioning
  createdBy: string;
  createdAt: Timestamp;
}

export interface KPIWeights {
  id?: string; // e.g. "global_kpi"
  attendance: number;
  reports: number;
  tasks: number;
  customerRating: number;
  leadConversion: number;
  updatedAt: Timestamp;
}

export interface CommissionSettings {
  id?: string; // e.g. "global_commission"
  leadConversion: number;
  customerRatingBonus: number;
  updatedAt: Timestamp;
}

export interface PerformanceBonusRules {
  id?: string; // e.g. "global_bonus_rules"
  tiers: {
    [scoreFloor: string]: number; // e.g. {"60": 5000, "70": 10000}
  };
  updatedAt: Timestamp;
}

export interface CompanySettings {
  id?: string; // e.g. "global_company"
  currency: string;
  currencySymbol: string;
  country: string;
  updatedAt: Timestamp;
}

export interface EmployeePerformance {
  id?: string;
  userId: string;
  month: string; // "YYYY-MM"
  year: number;
  department: string;
  
  attendanceScore: number;
  reportScore: number;
  taskScore: number;
  customerRatingScore: number;
  conversionScore: number;
  
  finalScore: number;
  
  weightsSnapshot?: KPIWeights;
  rank?: number;
  generatedAt: Timestamp;
}

export type PayrollPeriodStatus = "draft" | "generated" | "approved" | "paid" | "closed";

export interface PayrollPeriod {
  id?: string; // e.g. "2026-06"
  month: string;
  year: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: PayrollPeriodStatus;
  totalEmployees?: number;
  totalPayroll?: number;
  createdAt: Timestamp;
}

export interface Commission {
  id?: string;
  employeeId: string;
  periodId: string;
  source: "lead_conversion" | "high_rating" | "attendance_bonus" | string;
  quantity: number;
  rate: number;
  amount: number;
  createdAt: Timestamp;
}

export interface Bonus {
  id?: string;
  employeeId: string;
  periodId: string;
  reason: string;
  amount: number;
  createdAt: Timestamp;
}

export interface Deduction {
  id?: string;
  employeeId: string;
  periodId: string;
  type: "manual" | "automatic";
  source?: string;
  reason: string;
  amount: number;
  createdAt: Timestamp;
}

export interface PayrollRecord {
  id?: string;
  payrollNumber: string; // ASB-PAY-YYYY-XXXXXX
  employeeId: string;
  employeeName: string;
  department: string;
  payrollPeriod: string; // e.g. "2026-06"
  
  baseSalary: number;
  allowances: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  
  grossPay: number;
  netPay: number;
  
  status: "draft" | "generated" | "approved" | "paid" | "closed";
  createdAt: Timestamp;
}

export interface PayrollGenerationLog {
  id?: string;
  periodId: string;
  generatedBy: string;
  generatedAt: Timestamp;
  totalEmployees: number;
  totalPayroll: number;
}

export interface PayrollAuditLog {
  id?: string;
  generatedBy: string;
  generatedAt: Timestamp;
  targetRecordId?: string;
  periodId: string;
  action: "generated" | "status_change" | "salary_update";
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// ==========================================
// Phase 7: Executive Analytics & Business Intelligence
// ==========================================

export interface SystemAlert {
  id?: string;
  type: "low_attendance" | "high_complaints" | "kpi_drop" | "payroll_issue" | "high_risk_employee";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  createdAt: Timestamp;
  resolved: boolean;
}

export interface ExecutiveInsight {
  id?: string;
  category: "workforce" | "crm" | "payroll" | "general";
  summary: string;
  createdAt: Timestamp;
}

export interface AnalyticsMetadata {
  id?: string; // e.g. "global_analytics"
  lastGeneratedAt: Timestamp;
  generatedBy: string;
}
