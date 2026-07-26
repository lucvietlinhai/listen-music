import { type LucideIcon } from "lucide-react";

export function ClayIcon({
  icon: Icon,
  className = "",
  size = "md",
}: {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-16 h-16" };
  const iconSizes = { sm: 20, md: 24, lg: 28 };

  return (
    <span className={`clay-icon ${sizes[size]} ${className}`}>
      <Icon size={iconSizes[size]} strokeWidth={2.2} className="text-text" />
    </span>
  );
}
