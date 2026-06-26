import React from 'react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import { ReportTemplateField } from '@/types';

interface FieldFactoryProps {
  field: ReportTemplateField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  control?: Control<any>; // Optional for more complex fields like DatePicker or MultiSelect
}

export const FieldFactory: React.FC<FieldFactoryProps> = ({ field, register, errors, control }) => {
  const errorMessage = errors[field.name]?.message as string;
  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0A3D91] outline-none transition-shadow ${
    errorMessage ? 'border-red-500' : 'border-slate-300'
  } bg-white text-slate-800`;

  return (
    <div className="flex flex-col space-y-1 mb-4">
      <label className="text-sm font-semibold text-slate-700">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          {...register(field.name)}
          className={`${inputClass} min-h-[100px] resize-y`}
        />
      ) : field.type === 'select' && field.options ? (
        <select {...register(field.name)} className={inputClass}>
          <option value="">Select an option...</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'radio' && field.options ? (
        <div className="flex flex-col space-y-2 mt-2">
          {field.options.map(opt => (
            <label key={opt} className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value={opt} {...register(field.name)} className="w-4 h-4 text-[#0A3D91]" />
              <span className="text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center space-x-2 cursor-pointer mt-1">
          <input type="checkbox" {...register(field.name)} className="w-4 h-4 text-[#0A3D91] rounded border-slate-300 focus:ring-[#0A3D91]" />
          <span className="text-slate-700">Yes / Confirm</span>
        </label>
      ) : field.type === 'file' ? (
        <input 
          type="file" 
          {...register(field.name)}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0A3D91] file:text-white hover:file:bg-[#082a63] cursor-pointer"
        />
      ) : (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
          {...register(field.name)}
          className={inputClass}
        />
      )}

      {errorMessage && <span className="text-xs text-red-500 font-medium">{errorMessage}</span>}
    </div>
  );
};
