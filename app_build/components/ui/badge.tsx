import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-input bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: VariantProps<typeof badgeVariants>["variant"];
}

const Badge = React.forwardRef<
  HTMLSpanElement,
  BadgeProps
>(({ className, variant, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={badgeVariants({ variant, className })}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };