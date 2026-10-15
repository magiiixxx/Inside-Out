import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The look of each button comes from the template's classes in
// src/app/globals.css (btn-primary, btn-secondary, btn-ghost, btn-danger).
// "outline" is kept as another name for the secondary button.
const buttonVariants = cva("whitespace-nowrap", {
  variants: {
    variant: {
      default: "btn-primary",
      secondary: "btn-secondary",
      outline: "btn-secondary",
      ghost: "btn-ghost",
      destructive: "btn-danger",
    },
    size: {
      default: "",
      sm: "px-3 py-1.5 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "w-11 px-0",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
