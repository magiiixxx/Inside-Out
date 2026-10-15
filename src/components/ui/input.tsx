import * as React from "react";
import { cn } from "@/lib/utils";

// The look comes from the template's "field" class in src/app/globals.css.
// mt-0 because our forms already space a label and its field with a gap.
export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn("field mt-0", className)} {...props} />;
}
