import { z } from "zod";
import { ReportTemplateField } from "@/types";

export const generateZodSchema = (fields: ReportTemplateField[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    let fieldSchema: any;

    switch (field.type) {
      case "text":
      case "textarea":
      case "phone":
      case "date":
      case "time":
      case "radio":
      case "select":
        fieldSchema = z.string();
        break;
      case "email":
        fieldSchema = z.string().email({ message: "Invalid email address" });
        break;
      case "number":
        // Form inputs are often strings initially, we can preprocess or just enforce number
        fieldSchema = z.coerce.number();
        break;
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      case "multiselect":
        fieldSchema = z.array(z.string());
        break;
      case "file":
        fieldSchema = z.any(); // File uploads are handled separately before submit usually
        break;
      default:
        fieldSchema = z.any();
    }

    if (field.required) {
      if (field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "radio") {
        fieldSchema = fieldSchema.min(1, { message: `${field.label} is required` });
      } else if (field.type === "multiselect") {
        fieldSchema = fieldSchema.min(1, { message: `Please select at least one ${field.label}` });
      }
    } else {
      if (field.type === "number") {
        fieldSchema = fieldSchema.optional();
      } else {
        fieldSchema = fieldSchema.optional().or(z.literal(""));
      }
    }

    schemaShape[field.name] = fieldSchema;
  });

  return z.object(schemaShape);
};
