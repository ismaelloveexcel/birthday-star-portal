import type { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export default function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}