import { ReportTemplate } from "@/types";
import { generateZodSchema } from "./validationFactory";

export const createReportFormConfig = (template: ReportTemplate) => {
  const schema = generateZodSchema(template.fields);
  
  const defaultValues: Record<string, any> = {};
  template.fields.forEach(field => {
    switch(field.type) {
      case "checkbox":
        defaultValues[field.name] = false;
        break;
      case "multiselect":
        defaultValues[field.name] = [];
        break;
      default:
        defaultValues[field.name] = "";
    }
  });

  return { schema, defaultValues };
};
