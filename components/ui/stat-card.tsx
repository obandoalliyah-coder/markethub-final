import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  const changeColor = 
    changeType === "up" 
      ? "text-emerald-600 dark:text-emerald-400" 
      : changeType === "down" 
      ? "text-rose-600 dark:text-rose-400" 
      : "text-muted-foreground";

  return (
    <Card className={cn("hover:shadow-md transition-all duration-200 border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold tracking-tighter">
          {value}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {change && (
            <span className={cn("font-medium", changeColor)}>
              {change}
            </span>
          )}
          {description && (
            <span className="text-muted-foreground text-xs">
              {description}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}