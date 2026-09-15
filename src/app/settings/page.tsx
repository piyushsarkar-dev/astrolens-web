"use client";

import {
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
import { useTheme } from "@/components/Providers/ThemeProvider";
import { COLOR_PRESETS, type CustomThemeData } from "@/lib/themes";

const SettingsPage = () => {
  const {
    user,
    profile,
    avatarUrl,
    avatarConfig,
    keyStatus,
    loading,
    profileLoading,
    refreshProfile,
  } = useAuth();

  const {
    theme,
    setTheme,
    preset,
    customTheme,
    applyPreset,
    applyCustomTheme,
    resetTheme,
  } = useTheme();

  // Stored display name: auth metadata wins, then the profiles table.
  const storedName =
    (user?.user_metadata?.display_name as string | undefined) ||
    profile?.display_name ||
    "";

  const [name, setName] = useState(storedName);
  const [newKey, setNewKey] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyBusy, setKeyBusy] = useState(false);

  // Tweakcn import state
  const [tweakcnInput, setTweakcnInput] = useState("");
  const [importingTheme, setImportingTheme] = useState(false);
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  // Re-sync the input when the stored name arrives or changes — adjusted
  // during render (React's documented pattern) instead of in an effect.
  const [syncedName, setSyncedName] = useState(storedName);
  if (storedName !== syncedName) {
    setSyncedName(storedName);
    setName(storedName);
  }

  if (loading) return <p className="text-mist px-4 pt-28 text-sm">Loading settings…</p>;
  if (!user) return <p className="px-4 pt-28 text-sm">Please log in to open settings.</p>;

  // Save selected preset to Supabase profile
  const handleSelectPreset = async (presetId: string) => {
    applyPreset(presetId);
    setThemeFeedback("Theme updated.");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { theme_preset: presetId, custom_theme: null },
      });
      try {
        await supabase
          .from("profiles")
          .update({ theme_preset: presetId, custom_theme: null })
          .eq("id", user.id);
      } catch {
        // Migration may not have been run yet
      }
    } catch {
      // Local storage already persists
    }
  };

  // Import theme from tweakcn URL or CSS snippet
  const handleImportTweakcn = async (e: FormEvent) => {
    e.preventDefault();
    if (!tweakcnInput.trim()) return;
    setImportingTheme(true);
    setThemeFeedback(null);
    setError(null);

    try {
      const isCss =
        tweakcnInput.includes("{") ||
        tweakcnInput.includes("--") ||
        tweakcnInput.includes(":root");

      const payload = isCss
        ? { css: tweakcnInput.trim() }
        : { url: tweakcnInput.trim() };

      const res = await fetch("/api/tweakcn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse tweakcn theme.");
      }

      const imported: CustomThemeData = data.theme;
      applyCustomTheme(imported);
      setTweakcnInput("");
      setThemeFeedback(`Imported & applied "${imported.name || "Custom Tweakcn Theme"}"!`);

      // Persist to Supabase
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { theme_preset: "custom", custom_theme: imported },
      });
      try {
        await supabase
          .from("profiles")
          .update({ theme_preset: "custom", custom_theme: imported })
          .eq("id", user.id);
      } catch {
        // Migration may not have been run yet
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Theme import failed.");
    } finally {
      setImportingTheme(false);
    }
  };

  const handleResetTheme = async () => {
    resetTheme();
    setThemeFeedback("Reset to default Astro Sky theme.");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { theme_preset: "default", custom_theme: null },
      });
      try {
        await supabase
          .from("profiles")
          .update({ theme_preset: "default", custom_theme: null })
          .eq("id", user.id);
      } catch {
        // Migration may not have been run yet
      }
    } catch {
      // ignore
    }
  };

  // ImgBB key management
  const saveKey = async () => {
    setKeyBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/profile/imgbb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newKey.trim() }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Could not save the key.");
      setNewKey("");
      await refreshProfile();
      setInfo("ImgBB API key saved. Uploads are enabled for your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setKeyBusy(false);
    }
  };

  const removeKey = async () => {
    setKeyBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/profile/imgbb", { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Could not remove the key.");
      setNewKey("");
      await refreshProfile();
      setInfo("ImgBB API key removed. Uploads are disabled until you add a new key.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setKeyBusy(false);
    }
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: e1 } = await supabase.auth.updateUser({
        data: { display_name: name.trim() },
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        display_name: name.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (e2) throw e2;
      await refreshProfile();
      setInfo("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-lg px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <div className="vault-card rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">Settings</h2>

        {/* User Card */}
        <div className="ring-line-subtle mt-5 flex items-center gap-4 rounded-2xl p-4 ring-1">
          <UserAvatar
            seed={user.id}
            avatarUrl={avatarUrl}
            avatarConfig={avatarConfig}
            size={56}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {profile?.display_name || name || "Account"}
            </p>
            <p className="text-mist truncate text-sm">{user.email}</p>
          </div>
        </div>

        {/* Display Name Form */}
        <form onSubmit={saveName} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Display name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Piyush"
              className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-sky inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save name
          </button>
        </form>

        {/* ================================================================= */}
        {/* APPEARANCE & THEME CUSTOMIZATION (Logged-in only) */}
        {/* ================================================================= */}
        <div className="ring-line-subtle mt-7 rounded-2xl p-4 sm:p-5 ring-1">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-sky" aria-hidden />
            <p className="text-base font-semibold">Customize Appearance</p>
          </div>
          <p className="text-mist mt-1 text-xs">
            Personalize your Astro Lens interface with curated color themes or your own tweakcn.com configuration.
          </p>

          {/* Dark / Light Mode Selector */}
          <div className="mt-4">
            <span className="text-mist mb-2 block text-xs font-semibold uppercase tracking-wider">
              Interface Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ring-1 ${
                  theme === "dark"
                    ? "bg-sky text-white ring-sky"
                    : "bg-vault-lowest ring-line-subtle text-mist hover:text-foreground"
                }`}
              >
                <Moon size={15} /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ring-1 ${
                  theme === "light"
                    ? "bg-sky text-white ring-sky"
                    : "bg-vault-lowest ring-line-subtle text-mist hover:text-foreground"
                }`}
              >
                <Sun size={15} /> Light Mode
              </button>
            </div>
          </div>

          {/* 8 Color Presets */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-mist block text-xs font-semibold uppercase tracking-wider">
                Color Presets
              </span>
              {preset !== "default" && (
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="text-mist hover:text-foreground flex items-center gap-1 text-xs transition"
                >
                  <RotateCcw size={12} /> Reset to Astro Sky
                </button>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COLOR_PRESETS.map((p) => {
                const isActive = preset === p.id;
                const accent = theme === "dark" ? p.accentHex : p.accentHexLight;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`group relative flex flex-col items-start gap-1.5 rounded-xl p-2.5 text-left transition ring-1 ${
                      isActive
                        ? "bg-vault-high ring-2"
                        : "bg-vault-lowest ring-line-subtle hover:bg-vault-low"
                    }`}
                    style={{
                      borderColor: isActive ? accent : undefined,
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="h-5 w-5 rounded-full ring-1 ring-black/20 shadow-sm"
                        style={{ backgroundColor: accent }}
                      />
                      {isActive && <Check size={14} style={{ color: accent }} />}
                    </div>
                    <span className="truncate text-xs font-medium">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* tweakcn.com Import Section */}
          <div className="mt-5 rounded-xl bg-vault-lowest/60 p-3.5 ring-1 ring-line-subtle">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky" />
                <span className="text-xs font-semibold">tweakcn.com Integration</span>
              </div>
              <a
                href="https://tweakcn.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky hover:underline inline-flex items-center gap-1 text-xs font-medium"
              >
                Browse tweakcn <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-mist mt-1 text-[11px] leading-relaxed">
              Design your custom palette on{" "}
              <a
                href="https://tweakcn.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-sky"
              >
                tweakcn.com
              </a>
              , copy the link or CSS snippet, and paste below to apply live.
            </p>

            <form onSubmit={handleImportTweakcn} className="mt-3 space-y-2">
              <input
                type="text"
                value={tweakcnInput}
                onChange={(e) => setTweakcnInput(e.target.value)}
                placeholder="Paste tweakcn URL or CSS code…"
                className="bg-vault-lowest ring-line-subtle w-full rounded-lg px-3 py-2 text-xs font-mono ring-1 outline-none focus:ring-2 focus:ring-sky/60"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={importingTheme || !tweakcnInput.trim()}
                  className="bg-sky inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-sky/90 disabled:opacity-50"
                >
                  {importingTheme ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  Apply Theme
                </button>

                {preset === "custom" && customTheme && (
                  <span className="text-leaf text-[11px] font-medium">
                    ✓ Active: {customTheme.name || "Custom Theme"}
                  </span>
                )}
              </div>
            </form>
          </div>

          {themeFeedback && (
            <p className="text-leaf mt-3 text-xs font-medium">{themeFeedback}</p>
          )}
        </div>

        {/* ImgBB API Key Section */}
        <div className="ring-line-subtle mt-6 rounded-2xl p-4 ring-1">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-sky" aria-hidden />
            <p className="text-sm font-semibold">Personal ImgBB API key</p>
            {profileLoading ? (
              <span className="text-mist ml-auto text-xs">Loading…</span>
            ) : keyStatus?.configured ? (
              <span className="text-leaf ml-auto rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold">
                Connected ······{keyStatus.last4}
              </span>
            ) : (
              <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                Not set
              </span>
            )}
          </div>
          <p className="text-mist mt-1.5 text-xs">
            Each account uploads with its own key. Free at api.imgbb.com. Without it, uploads stay disabled.
          </p>
          <p className="text-leaf mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck size={14} aria-hidden />
            Stored server-side — the full key is never shown or sent to the browser.
          </p>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-medium">
              {keyStatus?.configured ? "Replace key" : "API key"}
            </span>
            <input
              type="password"
              value={newKey}
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste your ImgBB API key"
              onChange={(e) => setNewKey(e.target.value)}
              className="bg-vault-lowest ring-line-subtle w-full rounded-xl px-4 py-2.5 font-mono text-sm ring-1 outline-none focus:ring-2 focus:ring-sky/60"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveKey}
              disabled={keyBusy || !newKey.trim()}
              className="bg-sky inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-sky/90 disabled:opacity-60"
            >
              {keyBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {keyStatus?.configured ? "Replace key" : "Save key"}
            </button>
            {keyStatus?.configured && (
              <button
                type="button"
                onClick={removeKey}
                disabled={keyBusy}
                className="text-destructive ring-line-subtle ring-destructive/30 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition hover:bg-red-500/5 disabled:opacity-60"
              >
                Remove key
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-leaf mt-4 rounded-xl bg-green-500/10 px-4 py-2.5 text-sm">
            {info}
          </p>
        )}
      </div>
    </section>
  );
};

export default SettingsPage;