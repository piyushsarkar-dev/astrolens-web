"use client";
import { Eye, EyeOff, KeyRound, Loader2, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
const ProfilePage = () => {
  const { user, profile, avatarUrl, avatarConfig, loading, profileLoading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [imgbbKey, setImgbbKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyTouched, setKeyTouched] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!user) return;
    setName((user.user_metadata?.display_name as string | undefined) || profile?.display_name || "");
  }, [user, profile?.display_name]);
  useEffect(() => {
    if (profile && !keyTouched) setImgbbKey(profile.imgbb_api_key || "");
  }, [profile, keyTouched]);
  if (loading) return <p className="text-mist pt-28 text-sm">Loading profile…</p>;
  if (!user) return <p className="pt-28 text-sm">Please log in to view your profile.</p>;
  const save = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setInfo(null); setSaving(true);
    try {
      const trimmedKey = imgbbKey.trim();
      if (trimmedKey && !/^[A-Za-z0-9]{20,64}$/.test(trimmedKey)) {
        throw new Error("That ImgBB API key doesn't look right — copy it again from https://api.imgbb.com.");
      }
      const supabase = createClient();
      const { error: e1 } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, display_name: name.trim() || null, imgbb_api_key: trimmedKey || null, updated_at: new Date().toISOString() });
      if (e2) {
        if (/imgbb_api_key/i.test(e2.message)) throw new Error("Database is missing the imgbb_api_key column. Run supabase/profiles.sql in SQL Editor, then try again.");
        throw e2;
      }
      setKeyTouched(false);
      await refreshProfile();
      setInfo("Profile saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  };
  const removeKey = async () => {
    setError(null); setInfo(null); setSaving(true);
    try {
      const supabase = createClient();
      const { error: e } = await supabase.from("profiles").update({ imgbb_api_key: null, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (e) throw e;
      setImgbbKey("");
      setKeyTouched(false);
      await refreshProfile();
      setInfo("ImgBB API key removed. Uploads are disabled until you add a new key.");
    } catch (err) { setError(err instanceof Error ? err.message : "Remove failed."); }
    finally { setSaving(false); }
  };
  return (
    <section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <UserAvatar seed={user.id} avatarUrl={avatarUrl} avatarConfig={avatarConfig} size={64} />
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold">Your profile</h2>
            <p className="text-mist mt-1 truncate text-sm">{user.email}</p>
            {avatarUrl ? (
              <p className="text-mist mt-0.5 text-xs">Avatar: Google profile photo</p>
            ) : (
              <p className="text-mist mt-0.5 text-xs">Avatar: auto-generated (surprise me!) — stable per account</p>
            )}
          </div>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Display name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Piyush" className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
          </label>
          <div className="ring-line-subtle rounded-2xl p-4 ring-1">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-sky" aria-hidden />
              <p className="text-sm font-semibold">Personal ImgBB API key</p>
              {profileLoading ? (
                <span className="text-mist ml-auto text-xs">Loading…</span>
              ) : profile?.imgbb_api_key ? (
                <span className="text-leaf ml-auto rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold">Connected</span>
              ) : (
                <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">Not set</span>
              )}
            </div>
            <p className="text-mist mt-1.5 text-xs">Each account uploads with its own key. Free at api.imgbb.com. Without it, uploads stay disabled.</p>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-medium">API key</span>
              <div className="relative">
                <input type={showKey ? "text" : "password"} value={imgbbKey} autoComplete="off" spellCheck={false} placeholder="Paste your ImgBB API key" onChange={(e) => { setImgbbKey(e.target.value); setKeyTouched(true); }} className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 pr-11 font-mono text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
                <button type="button" aria-label={showKey ? "Hide API key" : "Show API key"} onClick={() => setShowKey((v) => !v)} className="text-mist hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1.5 transition">
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {profile?.imgbb_api_key && (
              <button type="button" onClick={removeKey} disabled={saving} className="text-mist mt-2 text-xs underline-offset-2 hover:underline disabled:opacity-60">Remove saved key</button>
            )}
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>}
          {info && <p role="status" className="text-leaf rounded-xl bg-green-500/10 px-4 py-2.5 text-sm">{info}</p>}
          <button type="submit" disabled={saving} className="bg-sky inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky/90 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save profile
          </button>
        </form>
      </div>
    </section>
  );
};
export default ProfilePage;
