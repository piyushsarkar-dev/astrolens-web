"use client";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!user) return;
    setName((user.user_metadata?.display_name as string | undefined) || "");
  }, [user]);
  if (loading) return <p className="text-mist pt-28 text-sm">Loading profile…</p>;
  if (!user) return <p className="pt-28 text-sm">Please log in to view your profile.</p>;
  const save = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setInfo(null); setSaving(true);
    try {
      const supabase = createClient();
      const { error: e1 } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, display_name: name.trim() || null, updated_at: new Date().toISOString() });
      if (e2) throw e2;
      setInfo("Profile saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  };
  return (
    <section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">Your profile</h2>
        <p className="text-mist mt-1 text-sm">{user.email}</p>
        <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Display name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
          </label>
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
