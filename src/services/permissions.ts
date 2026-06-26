import { UserProfile } from "@/types";

export const canSubmitReport = (user: UserProfile | null) => {
  if (!user) return false;
  return ["developer", "marketer_adhoc", "marketer_contract", "customer_care", "automation"].includes(user.role);
};

export const canApproveReport = (user: UserProfile | null) => {
  if (!user) return false;
  return ["super_admin", "admin"].includes(user.role);
};

export const canViewDepartment = (user: UserProfile | null, targetDepartment: string) => {
  if (!user) return false;
  if (["super_admin", "admin"].includes(user.role)) return true;
  return user.department === targetDepartment;
};

export const canManageUsers = (user: UserProfile | null) => {
  if (!user) return false;
  return user.role === "super_admin";
};

export const canViewAllReports = (user: UserProfile | null) => {
  if (!user) return false;
  return ["super_admin", "admin"].includes(user.role);
};
