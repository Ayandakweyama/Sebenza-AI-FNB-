import React from 'react';
import { FormFieldProps } from './types';

const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
  icon,
  label,
  required = false,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`block w-full pl-10 pr-3 py-3 border ${
            error ? 'border-red-300' : 'border-slate-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;
