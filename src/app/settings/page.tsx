"use client";

import {
  ArrowLeft,
  Check,
  ExternalLink,
  HardDrive,
  Info,
  KeyRound,
  Loader2,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
import { useTheme } from "@/components/Providers/ThemeProvider";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Input } from "@/components/shadcnui/input";
import { Separator } from "@/components/shadcnui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcnui/tabs";
import { COLOR_PRESETS, type CustomThemeData } from "@/lib/themes";
import { cn } from "@/lib/utils";

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

  // Re-sync input when stored name changes
  const [syncedName, setSyncedName] = useState(storedName);
  if (storedName !== syncedName) {
    setSyncedName(storedName);
    setName(storedName);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-28 text-muted-foreground">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-sm">Loading settings…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <Card className="border-border p-8">
          <KeyRound size={32} className="mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please log in to manage your vault settings, custom appearance, and API credentials.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Save selected preset to Supabase profile
  const handleSelectPreset = async (presetId: string) => {
    applyPreset(presetId);
    setThemeFeedback("Theme updated successfully.");
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
      setThemeFeedback(`Applied theme "${imported.name || "Custom Tweakcn Theme"}" live across the full vault!`);

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
      setInfo("Display name updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground pt-24 pb-24 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        {/* Top Header & Breadcrumb */}
        <div className="mb-8 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Gallery
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-display">
              Settings
            </h1>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-mono text-xs">
              <ShieldCheck size={14} className="text-emerald-500" />
              Private Vault
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your personal profile, encrypted cloud storage credentials, interface aesthetics, and custom themes.
          </p>
        </div>

        {/* Feedback Alert Banners */}
        {info && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check size={16} className="shrink-0" />
            <span>{info}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
            <Info size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shadcn UI Tabs Navigation */}
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-card border border-border">
            <TabsTrigger value="appearance" className="flex items-center gap-2 rounded-lg text-xs font-medium">
              <Palette size={15} /> Appearance
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 rounded-lg text-xs font-medium">
              <User size={15} /> Account
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2 rounded-lg text-xs font-medium">
              <HardDrive size={15} /> Storage & API
            </TabsTrigger>
          </TabsList>

          {/* ================================================================= */}
          {/* TAB 1: APPEARANCE & THEME */}
          {/* ================================================================= */}
          <TabsContent value="appearance" className="space-y-6 outline-none">
            {/* Dark / Light Mode Selector Card */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Interface Mode</CardTitle>
                <CardDescription>
                  Choose between high-contrast dark mode or bright day mode.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex items-center justify-center gap-2.5 rounded-xl p-3.5 text-sm font-medium transition ring-1 cursor-pointer",
                      theme === "dark"
                        ? "bg-primary text-primary-foreground ring-primary shadow-sm"
                        : "bg-background ring-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Moon size={16} /> Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex items-center justify-center gap-2.5 rounded-xl p-3.5 text-sm font-medium transition ring-1 cursor-pointer",
                      theme === "light"
                        ? "bg-primary text-primary-foreground ring-primary shadow-sm"
                        : "bg-background ring-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Sun size={16} /> Light Mode
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* 8 Curated Color Presets Card */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Color Themes</CardTitle>
                  <CardDescription className="mt-1">
                    Select a curated palette. Each theme dynamically updates the whole page background, card surfaces, borders, and buttons.
                  </CardDescription>
                </div>
                {preset !== "default" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetTheme}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw size={13} /> Reset to Astro Sky
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {COLOR_PRESETS.map((p) => {
                    const isActive = preset === p.id;
                    const accent = theme === "dark" ? p.accentHex : p.accentHexLight;
                    const bgPreview = theme === "dark" ? p.previewBgDark : p.previewBgLight;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={cn(
                          "group relative flex flex-col items-start gap-2.5 rounded-xl p-3 text-left transition border cursor-pointer",
                          isActive
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                            : "border-border bg-background hover:bg-accent hover:border-border/80"
                        )}
                        style={{
                          borderColor: isActive ? accent : undefined,
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          {/* Dual Swatch Preview */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-4 rounded-full ring-1 ring-border shadow-inner"
                              style={{ backgroundColor: bgPreview }}
                              title="Background tone"
                            />
                            <span
                              className="size-4 rounded-full ring-1 ring-black/20 shadow-sm"
                              style={{ backgroundColor: accent }}
                              title="Accent color"
                            />
                          </div>
                          {isActive && <Check size={14} style={{ color: accent }} />}
                        </div>
                        <div>
                          <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* tweakcn.com Integration Card */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <CardTitle className="text-base font-semibold">tweakcn.com Live Integration</CardTitle>
                </div>
                <a
                  href="https://tweakcn.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open tweakcn.com <ExternalLink size={12} />
                </a>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Design any custom palette on{" "}
                  <a
                    href="https://tweakcn.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline hover:text-primary"
                  >
                    tweakcn.com
                  </a>
                  , copy the theme link or CSS snippet, and paste it below. Astro Lens will automatically map and apply your entire palette live.
                </p>

                <form onSubmit={handleImportTweakcn} className="space-y-3">
                  <Input
                    type="text"
                    value={tweakcnInput}
                    onChange={(e) => setTweakcnInput(e.target.value)}
                    placeholder="Paste tweakcn URL (https://tweakcn.com/...) or CSS code snippet…"
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      disabled={importingTheme || !tweakcnInput.trim()}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {importingTheme ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      Apply Live Theme
                    </Button>

                    {preset === "custom" && customTheme && (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs">
                        <Check size={12} /> Active: {customTheme.name || "Custom Theme"}
                      </Badge>
                    )}
                  </div>
                </form>
              </CardContent>
              {themeFeedback && (
                <CardFooter className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {themeFeedback}
                  </p>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 2: ACCOUNT & PROFILE */}
          {/* ================================================================= */}
          <TabsContent value="account" className="space-y-6 outline-none">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Profile Details</CardTitle>
                <CardDescription>
                  Manage your display name and view account identity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Identity Banner */}
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-accent/40 p-4">
                  <UserAvatar
                    seed={user.id}
                    avatarUrl={avatarUrl}
                    avatarConfig={avatarConfig}
                    size={64}
                    className="rounded-2xl border border-border shadow-sm"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-foreground truncate">
                        {profile?.display_name || name || "Vault Owner"}
                      </p>
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium pt-1"
                    >
                      Customize avatar style <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>

                {/* Display Name Form */}
                <form onSubmit={saveName} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="display-name" className="text-xs font-medium text-foreground">
                      Display Name
                    </label>
                    <Input
                      id="display-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Piyush Sarkar"
                      className="text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      This name is shown in the sidebar and top navigation of your vault.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Display Name
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 3: STORAGE & API KEYS */}
          {/* ================================================================= */}
          <TabsContent value="storage" className="space-y-6 outline-none">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">ImgBB Cloud API Key</CardTitle>
                  <CardDescription className="mt-1">
                    Astro Lens connects to ImgBB to store and serve your photography vault with zero limits.
                  </CardDescription>
                </div>
                {profileLoading ? (
                  <Badge variant="outline" className="text-xs">Loading…</Badge>
                ) : keyStatus?.configured ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Connected ····{keyStatus.last4}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs">
                    Not Configured
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="api-key" className="text-xs font-medium text-foreground">
                    {keyStatus?.configured ? "Update API Key" : "Enter API Key"}
                  </label>
                  <Input
                    id="api-key"
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder={keyStatus?.configured ? "Enter new API key to replace…" : "Paste your 32-character ImgBB API key…"}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={saveKey}
                    disabled={keyBusy || !newKey.trim()}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {keyBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save API Key
                  </Button>

                  {keyStatus?.configured && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={removeKey}
                      disabled={keyBusy}
                      className="gap-1.5 text-xs"
                    >
                      <Trash2 size={14} /> Remove Key
                    </Button>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Info size={14} className="text-primary" />
                    <span>How to get your free ImgBB API key</span>
                  </div>
                  <p className="leading-relaxed">
                    1. Create or log into your free account at{" "}
                    <a
                      href="https://imgbb.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      imgbb.com
                    </a>
                    .<br />
                    2. Go to the{" "}
                    <a
                      href="https://api.imgbb.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      ImgBB API page
                    </a>{" "}
                    and click &quot;Get API key&quot;.<br />
                    3. Copy your 32-character key and paste it above. Your key is securely stored in your personal profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;