import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  headerAction,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "apple-glass rounded-2xl p-6 transition-all duration-200",
          className
        )
      )}
      {...props}
    >
      {(title || description || headerAction) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-border/50">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
