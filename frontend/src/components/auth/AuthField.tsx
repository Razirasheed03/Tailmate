import { Mail, Lock, User } from "lucide-react";
import { authIconWrap, authInput, authInputError, authInputWithToggle, authLabel } from "./authStyles";

const icons = {
  email: Mail,
  password: Lock,
  user: User,
} as const;

type FieldType = keyof typeof icons;

type AuthFieldProps = {
  label: string;
  type?: FieldType;
  error?: string;
  withToggle?: boolean;
  toggleSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function AuthField({
  label,
  type = "email",
  error,
  withToggle,
  toggleSlot,
  children,
}: AuthFieldProps) {
  const Icon = icons[type];

  return (
    <div>
      <label className={authLabel}>{label}</label>
      <div className="relative">
        <div className={authIconWrap}>
          <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={2.2} />
        </div>
        {children}
        {withToggle && toggleSlot}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function getInputClassName(hasError?: boolean, withToggle?: boolean) {
  const base = withToggle ? authInputWithToggle : authInput;
  return hasError ? `${base} ${authInputError}` : base;
}
