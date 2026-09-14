"use client";
import { ExternalLink, Settings } from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
const ProfilePage = () => {
  const { user, profile, avatarUrl, avatarConfig, keyStatus, loading } = useAuth();
  if (loading) return <p className="text-mist pt-28 text-sm">Loading profile…</p>;
  if (!user) return <p className="pt-28 text-sm">Please log in to view your profile.</p>;
  const name =
    profile?.display_name ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Account";
  return (
    <section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 text-center sm:p-8">
        <UserAvatar seed={user.id} avatarUrl={avatarUrl} avatarConfig={avatarConfig} size={96} className="ring-line-subtle mx-auto ring-2" />
        <h2 className="font-display mt-4 truncate text-2xl font-bold">{name}</h2>
        <p className="text-mist mt-1 truncate text-sm">{user.email}</p>
        {avatarUrl ? (
          <p className="text-mist mt-2 text-xs">Google profile photo</p>
        ) : (
          <p className="text-mist mt-2 text-xs">Generated avatar · picked at signup</p>
        )}
        <div className="ring-line-subtle my-5 h-px" />
        <dl className="space-y-2.5 text-left text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-mist">Member since</dt>
            <dd className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-mist">Login method</dt>
            <dd className="font-medium">{avatarUrl ? "Google" : "Email & password"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-mist">ImgBB key</dt>
            <dd className="font-medium">{keyStatus?.configured ? `Connected ······${keyStatus.last4}` : "Not set"}</dd>
          </div>
        </dl>
        <a href="/settings" className="bg-sky hover:bg-sky/90 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition">
          <Settings size={16} aria-hidden /> Open settings
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </section>
  );
};
export default ProfilePage;