"use client";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import UserAvatar from "./UserAvatar";
const UserMenu = () => {
  const { user, avatarUrl, avatarConfig, loading, signOut } = useAuth();
  const router = useRouter();
  const homePath = "/" as never;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (loading) {
    return <span className="bg-foreground/[0.04] ring-line-subtle size-9 animate-pulse rounded-full ring-1" aria-hidden />;
  }
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a href="/login" className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">Log in / Sign up</a>
      </div>
    );
  }
  const label = (user.user_metadata?.display_name as string | undefined) || user.email || "Account";
  const logOut = async () => {
    setOpen(false);
    await signOut();
    router.push(homePath);
    router.refresh();
  };
  const itemCls = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-foreground/[0.06]";
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm font-medium ring-1 backdrop-blur transition">
        <UserAvatar seed={user.id} avatarUrl={avatarUrl} avatarConfig={avatarConfig} size={26} aria-hidden />
        <span className="hidden max-w-28 truncate sm:block">{label}</span>
      </button>

      {open && (
        <div role="menu" className="ring-line-strong bg-vault-low absolute right-0 z-50 mt-2 w-56 rounded-2xl p-2 ring-1 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserAvatar seed={user.id} avatarUrl={avatarUrl} avatarConfig={avatarConfig} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{label}</p>
              <p className="text-mist truncate text-xs">{user.email}</p>
            </div>
          </div>
          <div className="ring-line-subtle my-1 h-px" />
          <a href="/profile" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            <UserRound size={16} aria-hidden /> Profile
          </a>
          <a href="/settings" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            <Settings size={16} aria-hidden /> Settings
          </a>
          <div className="ring-line-subtle my-1 h-px" />
          <button type="button" role="menuitem" onClick={logOut} className={`${itemCls} text-destructive`}>
            <LogOut size={16} aria-hidden /> Log out
          </button>
        </div>
      )}
      {open && <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />}
    </div>
  );
};
export default UserMenu;
