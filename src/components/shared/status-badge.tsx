import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  label: string
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral"
  className?: string
}

const variantStyles = {
  default: "bg-primary/20 text-primary border-primary/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  neutral: "bg-muted text-muted-foreground border-muted",
}

export function StatusBadge({ label, variant = "default", className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", variantStyles[variant], className)}
    >
      {label}
    </Badge>
  )
}
