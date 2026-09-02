import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-xs border-[1.5px] border-input bg-surface px-3 py-2 text-base transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-ink-sm)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
