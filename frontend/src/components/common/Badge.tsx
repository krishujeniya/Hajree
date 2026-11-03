import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AttendanceStatus, Role } from "../../types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  role?: Role;
  status?: AttendanceStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  role,
  status,
  className,
}) => {
  let computedVariant = variant;
  let label = children;

  if (role) {
    if (role === "admin") {
      computedVariant = "danger";
      label = label || "Admin";
    } else if (role === "teacher") {
      computedVariant = "info";
      label = label || "Faculty";
    } else {
      computedVariant = "success";
      label = label || "Student";
    }
  } else if (status) {
    if (status === "present") {
      computedVariant = "success";
      label = label || "Present";
    } else if (status === "absent") {
      computedVariant = "danger";
      label = label || "Absent";
    } else {
      computedVariant = "warning";
      label = label || "Late";
    }
  }

  const variantStyles = {
    default: "bg-muted text-muted-foreground border-border/50",
    success:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    info: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase",
          variantStyles[computedVariant],
          className
        )
      )}
    >
      {label}
    </span>
  );
};
