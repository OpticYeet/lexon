import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:border-ink/20 hover:shadow-sm hover:bg-card-hover",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
