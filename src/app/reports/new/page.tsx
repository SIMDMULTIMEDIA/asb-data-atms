"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { ReportTemplate } from "@/types";
import { createReportFormConfig } from "@/schemas/reportFactory";
import { FieldFactory } from "@/schemas/fieldFactory";
import { submitReport, saveOfflineDraft, generateReportNumber } from "@/services/reports";
import { getCurrentShift } from "@/services/shift";
import { sendNotification } from "@/services/notifications";
import { logActivity } from "@/services/logger";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { Save, Send, AlertCircle } from "lucide-react";

export default function NewReportPage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!userData) return;
      
      try {
        const q = query(collection(getFirebaseDb() as any, "report_templates"), where("department", "==", userData.department));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const tpl = snapshot.docs[0].data() as ReportTemplate;
          setTemplate(tpl);
          const { schema: s, defaultValues } = createReportFormConfig(tpl);
          setSchema(s);
          form.reset(defaultValues);
        } else {
          setError("No report templates found for your department.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load template.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [userData, form]);

  useEffect(() => {
    if (!template) return;
    
    const interval = setInterval(() => {
      const currentData = form.getValues();
      saveOfflineDraft({
        id: `draft_${userData?.uid}_${template.id}`,
        userId: userData?.uid,
        department: userData?.department,
        reportType: template.reportType,
        data: currentData,
        status: "draft"
      });
      console.log("Auto-saved draft locally to IndexedDB");
    }, 30000);

    return () => clearInterval(interval);
  }, [form, template, userData]);

  const onSubmit = async (data: any) => {
    if (!userData || !template) return;
    
    setSubmitting(true);
    setError("");

    try {
      const { shift, deadlineAt, isLate } = getCurrentShift();
      const reportNumber = generateReportNumber();
      
      const attachments: string[] = [];
      const dataWithoutFiles = { ...data };
      
      for (const field of template.fields) {
        if (field.type === "file" && data[field.name]?.length > 0) {
          // Temporarily disable file storage per architecture decision.
          attachments.push("metadata_only_file");
          delete dataWithoutFiles[field.name];
        }
      }

      await submitReport({
        reportNumber,
        userId: userData.uid,
        department: userData.department,
        reportType: template.reportType,
        shift,
        status: "submitted",
        data: dataWithoutFiles,
        attachments,
        deadlineAt: deadlineAt as any,
        submittedLate: isLate
      });
      
      await logActivity(userData.uid, "submitted_report", userData.department);
      
      // Mock Manager UID - real app would lookup the manager
      await sendNotification(
        "admin_uid", 
        "New Report Submitted",
        `${userData.fullName} submitted ${reportNumber}`,
        "report",
        "medium"
      );

      router.push("/reports");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit report.");
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!userData || !template) return;
    
    try {
      const { shift, deadlineAt, isLate } = getCurrentShift();
      const reportNumber = generateReportNumber();
      
      const currentData = form.getValues();
      const dataWithoutFiles = { ...currentData };
      for (const field of template.fields) {
        if (field.type === "file") {
          delete dataWithoutFiles[field.name];
        }
      }

      await submitReport({
        reportNumber,
        userId: userData.uid,
        department: userData.department,
        reportType: template.reportType,
        shift,
        status: "draft",
        data: dataWithoutFiles,
        attachments: [],
        deadlineAt: deadlineAt as any,
        submittedLate: isLate
      });

      router.push("/reports");
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError("Failed to save draft.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading template...</div>;
  if (error && !template) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <AuthGuard>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D91]">{template?.title}</h1>
          <p className="text-slate-600">Fill out the fields below. A draft is saved locally to IndexedDB every 30 seconds.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="space-y-2">
            {template?.fields.map(field => (
              <FieldFactory 
                key={field.name} 
                field={field} 
                register={form.register} 
                errors={form.formState.errors} 
                control={form.control}
              />
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-[#0A3D91] hover:bg-[#082a63] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
