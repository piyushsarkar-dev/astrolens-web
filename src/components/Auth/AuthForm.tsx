"use client";
import { Aperture, Loader2, MailCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
export type AuthMode = "login" | "signup";
type AuthFormProps = { initialMode?: AuthMode };
const emailRedirect = () =>
  typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
const RATE_LIMIT_MSG =
  "Too many attempts — Supabase temporarily blocked signup from this network (HTTP 429 rate limit). Wait 10–15 minutes, then try ONCE. Fixes: Dashboard → Authentication → Rate Limits → raise 'Email signup per IP per hour', or turn OFF 'Confirm email' for local testing, or switch phone/WiFi network.";
const rateLimited = (e: unknown) =>
  e instanceof Error && /(429|rate limit|too many|over.*limit|email.*limit)/i.test(e.message);
const Inner = ({ initialMode = "login" }: AuthFormProps) => {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    params.get("tab") === "signup" ? "signup" : initialMode,
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "callback"
      ? "Confirmation link expired or invalid. Log in or sign up again."
      : null,
  );
  const [info, setInfo] = useState<string | null>(
    params.get("confirmed") === "1"
      ? "Email confirmed! Now log in with your email and password."
      : null,
  );
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const homePath = "/" as never;
  const switchMode = (m: AuthMode) => {
    setMode(m); setError(null); setInfo(null); setNeedsConfirm(false);
  };
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
    setError(null); setInfo(null); setNeedsConfirm(false); setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
            emailRedirectTo: emailRedirect(),
          },
        });
        if (e) {
          if (rateLimited(e)) {
            startCooldown(60);
            throw new Error(RATE_LIMIT_MSG);
          }
          throw e;
        }
        // Supabase returns no session when "Confirm email" is ON.
        if (data.session) {
          router.push(homePath); router.refresh();
        } else {
          setNeedsConfirm(true);
          setInfo("Account created! Please confirm your account — we sent a confirmation link to your inbox. Click it, then log in here.");
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) {
          if (rateLimited(e)) {
            startCooldown(60);
            throw new Error(RATE_LIMIT_MSG);
          }
          if (/confirm|verified|verification/i.test(e.message)) {
            setNeedsConfirm(true);
            throw new Error("Your account is not confirmed yet. Click the confirmation link in your email inbox, then try logging in again.");
          }
          throw e;
        }
        router.push(homePath); router.refresh();
      }
    } catch (err) {
      if (rateLimited(err)) {
        startCooldown(60);
        setError(RATE_LIMIT_MSG);
      } else if (err instanceof TypeError && /fetch|network|load/i.test(err.message)) {
        const cause = await diagnose();
        setError(cause ?? "Network error reaching Supabase. Check your connection and Project URL.");
      } else {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    } finally { setLoading(false); }
  };
  const resendLink = async () => {
    const target = email.trim();
    if (!target) { setError("Type your email above first, then resend."); return; }
    setResending(true); setError(null);
    try {
      const supabase = createClient();
      const { error: e } = await supabase.auth.resend({ type: "signup", email: target, options: { emailRedirectTo: emailRedirect() } });
      if (e) {
        if (rateLimited(e)) { startCooldown(60); throw new Error(RATE_LIMIT_MSG); }
        throw e;
      }
      setInfo("Confirmation email re-sent! Check your inbox (and spam folder).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email.");
    } finally { setResending(false); }
  };
  return (
    <section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 sm:p-8">
        <span className="bg-success/15 text-success ring-line-subtle grid size-11 place-items-center rounded-full ring-1">
          <Aperture size={22} />
        </span>
        <h2 className="font-display mt-4 text-2xl font-bold">Welcome to Astro Lens</h2>
        <p className="text-mist mt-1 text-sm">Log in or create your own private photo vault.</p>
        <div role="tablist" aria-label="Login or signup" className="bg-vault-lowest ring-line-subtle mt-5 grid grid-cols-2 gap-1 rounded-full p-1 ring-1">
          <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")} className={mode === "login" ? "bg-sky rounded-full px-4 py-2 text-sm font-semibold text-white transition" : "text-mist rounded-full px-4 py-2 text-sm font-medium transition hover:text-foreground"}>Log in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")} className={mode === "signup" ? "bg-sky rounded-full px-4 py-2 text-sm font-semibold text-white transition" : "text-mist rounded-full px-4 py-2 text-sm font-medium transition hover:text-foreground"}>Sign up</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
          {(info || needsConfirm) && (
            <div role="status" className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm">
              <p className="text-leaf flex items-center gap-2 font-semibold"><MailCheck size={16} aria-hidden />{needsConfirm ? "Please confirm your account" : "Done"}</p>
              {info && <p className="text-leaf mt-1">{info}</p>}
              {needsConfirm && (
                <div className="mt-2 space-y-1.5 text-[13px]">
                  <p className="text-mist">1. Open your email inbox (check spam too).</p>
                  <p className="text-mist">2. Click the confirmation link, then come back and log in.</p>
                  <button type="button" onClick={resendLink} disabled={resending} className="text-sky font-medium hover:underline disabled:opacity-60">{resending ? "Sending…" : "Resend confirmation email"}</button>
                </div>
              )}
            </div>
          )}
          <button type="submit" disabled={loading} className="bg-sky inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky/90 disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
      </div>
    </section>
  );
};
const AuthForm = (props: AuthFormProps) => (
  <Suspense fallback={<section className="mx-auto w-full max-w-md pt-28 pb-16 sm:pt-32"><div className="vault-card rounded-3xl p-6 sm:p-8"><p className="text-mist text-sm">Loading…</p></div></section>}>
    <Inner {...props} />
  </Suspense>
);
export default AuthForm;
