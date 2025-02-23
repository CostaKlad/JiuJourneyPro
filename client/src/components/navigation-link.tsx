
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface NavigationLinkProps extends React.ComponentProps<typeof Link> {
  className?: string;
}

export function NavigationLink({ className, ...props }: NavigationLinkProps) {
  return (
    <Link
      className={cn(
        "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
