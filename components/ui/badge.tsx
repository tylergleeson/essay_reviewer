import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent",
        success:
          "bg-success/10 text-success border-transparent",
        destructive:
          "bg-destructive/10 text-destructive border-transparent",
        accent:
          "bg-accent/10 text-accent border-transparent",
        outline: "text-foreground border border-input",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
