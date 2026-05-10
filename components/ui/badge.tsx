import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
        className
      )}
      style={
        color
          ? { backgroundColor: `${color}15`, color }
          : undefined
      }
    >
      {children}
    </span>
  );
}
