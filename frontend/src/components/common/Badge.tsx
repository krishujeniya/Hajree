import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AttendanceStatus, Role } from "../../types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "solid" | "outline" | "subtle";
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
  let label = children;
  let customStyle = "border border-zinc-700 bg-zinc-900 text-zinc-200";

  if (role) {
    if (role === "admin") {
      customStyle = "bg-white text-black dark:bg-white dark:text-black border-transparent font-bold";
      label = label || "Admin";
    } else if (role === "teacher") {
      customStyle = "border border-zinc-500 bg-zinc-900 text-zinc-100 font-semibold";
      label = label || "Faculty";
    } else {
      customStyle = "border border-zinc-800 bg-zinc-950 text-zinc-400 font-medium";
      label = label || "Student";
    }
  } else if (status) {
    if (status === "present") {
      customStyle = "bg-zinc-100 text-black dark:bg-white dark:text-black font-bold border-transparent";
      label = label || "Present";
    } else if (status === "absent") {
      customStyle = "border border-zinc-600 bg-transparent text-zinc-400 font-medium";
      label = label || "Absent";
    } else {
      customStyle = "border border-zinc-500 bg-zinc-900 text-zinc-300 font-medium";
      label = label || "Late";
    }
  } else if (variant === "solid") {
    customStyle = "bg-black text-white dark:bg-white dark:text-black font-bold";
  } else if (variant === "outline") {
    customStyle = "border border-zinc-700 bg-transparent text-foreground";
  }

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider select-none",
          customStyle,
          className
        )
      )}
    >
      {label}
    </span>
  );
};
