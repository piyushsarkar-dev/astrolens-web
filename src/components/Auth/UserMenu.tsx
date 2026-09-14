"use client";
import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
const UserMenu = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const loginPath = "/" as never;
  if (loading) {
    return <span className="bg-foreground/[0.04] ring-line-subtle size-9 animate-pulse rounded-full ring-1" aria-hidden />;
  }
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a href="/login" className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] rounded-full px-4 py-1.5 text-sm font-medium ring-1 backdrop-blur transition">Log in</a>
        <a href="/signup" className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">Sign up</a>
      </div>
    );
  }
  const label = (user.user_metadata?.display_name as string | undefined) || user.email || "Account";
  const initial = label.trim().charAt(0).toUpperCase() || "U";
  return (
    <div className="flex items-center gap-2">
      <a href="/profile" title={label} className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium ring-1 backdrop-blur transition">
        <span className="bg-sky grid size-7 place-items-center rounded-full text-xs font-bold text-white" aria-hidden>{initial}</span>
        <span className="hidden max-w-28 truncate sm:block">{label}</span>
        <UserRound size={14} className="text-mist" aria-hidden />
      </a>
      <button type="button" aria-label="Log out" title="Log out" onClick={async () => { await signOut(); router.push(loginPath); router.refresh(); }} className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] grid size-9 place-items-center rounded-full ring-1 backdrop-blur transition">
        <LogOut size={16} />
      </button>
    </div>
  );
};
export default UserMenu;
