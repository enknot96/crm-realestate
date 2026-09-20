export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-brand-teal text-white shadow-sm hover:bg-brand-navy",
  secondary: "border border-brand-teal text-brand-teal hover:bg-brand-teal/10",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return [BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(" ");
}
