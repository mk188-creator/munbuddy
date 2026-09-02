import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs border-[1.5px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-foreground bg-primary text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-foreground bg-destructive text-destructive-foreground",
        outline: "border-foreground bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
