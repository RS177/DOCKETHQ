import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User | null) {
  if (!user) return "DocketHQ user";

  const displayName = (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "DocketHQ user"
  ) as string;

  return displayName;
}

export function getUserInitials(user: User | null) {
  const displayName = getUserDisplayName(user);
  const parts = displayName
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "C";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  user,
  size = "md",
}: {
  user: User | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#071427] font-bold text-[#F7F3EA] ring-2 ring-[#B58A42]/40 ${sizeClasses[size]}`}
    >
      {getUserInitials(user)}
    </div>
  );
}
