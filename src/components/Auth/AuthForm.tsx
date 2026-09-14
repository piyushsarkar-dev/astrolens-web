"use client";
import { Aperture, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
type AuthFormProps = { mode: "login" | "signup" };
const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const heading = mode === "signup" ? "Create your account" : "Welcome back";
  const sub = mode === "signup" ? "Your own private photo vault." : "Log in to your photo vault.";
  const homePath = "/" as never;
  const diagnose = async (): Promise<string | null> => {
    // 1) Can the browser reach the Supabase Auth API at all?
    // This catches ad-blockers, offline, paused/deleted projects, wrong URL.
    try {
      const health = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "")}/auth/v1/health`,
        { method: "GET" },
      );
      if (!health.ok) {
        return `Supabase Auth API returned HTTP ${health.status}. The project may be paused/deleted or the URL is wrong. Check Supabase Dashboard → your project → Project Settings.`;
      }
    } catch {
      return "Browser could not reach Supabase at all (network blocked, wrong Project URL, project paused, or Brave Shields / ad-blocker blocking supabase.co). Try: disable Brave Shields for localhost, turn off ad-blocker, check internet, and verify the Project URL in Supabase Dashboard.";
    }
    return null;
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: displayName.trim() || email.split("@")[0] } },
        });
        if (e) throw e;
        setInfo("Account created! Check your inbox if confirmation is on.");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) throw e;
      }
      router.push(homePath); router.refresh();
    } catch (err) {
      if (err instanceof TypeError && /fetch|network|load/i.test(err.message)) {
        const cause = await diagnose();
        setError(cause ?? "Network error reaching Supabase. Check your connection and Project URL.");
      } else {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    } finally { setLoading(false); }
  };
  return (
    <section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 sm:p-8">
        <span className="bg-success/15 text-success ring-line-subtle grid size-11 place-items-center rounded-full ring-1">
          <Aperture size={22} />
        </span>
        <h2 className="font-display mt-4 text-2xl font-bold">{heading}</h2>
        <p className="text-mist mt-1 text-sm">{sub}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Display name</span>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Piyush" autoComplete="nickname" className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>}
          {info && <p role="status" className="text-leaf rounded-xl bg-green-500/10 px-4 py-2.5 text-sm">{info}</p>}
          <button type="submit" disabled={loading} className="bg-sky inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky/90 disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="text-mist mt-5 text-center text-sm">
          {mode === "signup" ? <>Already have an account? <a href="/login" className="text-sky font-medium hover:underline">Log in</a></> : <>New here? <a href="/signup" className="text-sky font-medium hover:underline">Create an account</a></>}
        </p>
      </div>
    </section>
  );
};
export default AuthForm;
