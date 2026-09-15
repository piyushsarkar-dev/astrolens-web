"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import type { AvatarConfig } from "./UserAvatar";

type KeyStatus = { configured: boolean; last4: string | null };
type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  avatarUrl: string | null;
  avatarConfig: AvatarConfig | null;
  keyStatus: KeyStatus | null;
  loading: boolean;
  profileLoading: boolean;
  hasImgbbKey: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// localStorage cache — stores non-sensitive profile metadata so the UI can
// render instantly on the next page load (stale-while-revalidate).
// The actual Supabase session/token is managed by Supabase itself.
// ---------------------------------------------------------------------------
const CACHE_KEY = "astrolens_auth_cache";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type AuthCache = {
  user: User;
  profile: Profile | null;
  keyStatus: KeyStatus | null;
  cachedAt: number;
};

function readCache(): AuthCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthCache;
    if (Date.now() - parsed.cachedAt > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: Omit<AuthCache, "cachedAt">) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }));
  } catch {
    // localStorage may be unavailable (private browsing, storage full, etc.)
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  avatarUrl: null,
  avatarConfig: null,
  keyStatus: null,
  loading: true,
  profileLoading: false,
  hasImgbbKey: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Hydrate from cache synchronously so the UI renders with real data on the
  // very first paint — no skeleton flash for returning users.
  const cached = typeof window !== "undefined" ? readCache() : null;

  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(cached?.keyStatus ?? null);
  // If we have a cached user we can skip the loading skeleton entirely.
  const [loading, setLoading] = useState(!cached);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const supabase = createClient();
      // SECURITY: never select imgbb_api_key on the client.
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();
      const resolved = (data as Profile | null) ?? null;
      setProfile(resolved);
      return resolved;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchKeyStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/imgbb", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: KeyStatus }
        | null;
      const resolved = json?.data ?? { configured: false, last4: null };
      setKeyStatus(resolved);
      return resolved;
    } catch {
      const resolved = { configured: false, last4: null };
      setKeyStatus(resolved);
      return resolved;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const [resolvedProfile, resolvedKey] = await Promise.all([
      fetchProfile(user.id),
      fetchKeyStatus(),
    ]);
    // Update cache with fresh profile data.
    writeCache({ user, profile: resolvedProfile, keyStatus: resolvedKey });
  }, [user, fetchProfile, fetchKeyStatus]);

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const resolvedUser = data.user;
      setUser(resolvedUser);
      setLoading(false);

      if (resolvedUser) {
        // Fetch fresh profile & key status in the background, then update cache.
        Promise.all([fetchProfile(resolvedUser.id), fetchKeyStatus()]).then(
          ([resolvedProfile, resolvedKey]) => {
            if (!mounted) return;
            writeCache({
              user: resolvedUser,
              profile: resolvedProfile,
              keyStatus: resolvedKey,
            });
          },
        );
      } else {
        // No active session — clear stale cache so the next load doesn't flash
        // a phantom logged-in UI.
        clearCache();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const resolvedUser = session?.user ?? null;
      setUser(resolvedUser);
      if (resolvedUser) {
        Promise.all([fetchProfile(resolvedUser.id), fetchKeyStatus()]).then(
          ([resolvedProfile, resolvedKey]) => {
            writeCache({
              user: resolvedUser,
              profile: resolvedProfile,
              keyStatus: resolvedKey,
            });
          },
        );
      } else {
        setProfile(null);
        setKeyStatus(null);
        clearCache();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile, fetchKeyStatus]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured — just clear local state.
    }
    setUser(null);
    setProfile(null);
    setKeyStatus(null);
    clearCache();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        avatarUrl:
          profile?.avatar_url ??
          (user?.user_metadata?.avatar_url as string | undefined) ??
          (user?.user_metadata?.picture as string | undefined) ??
          null,
        avatarConfig:
          (user?.user_metadata?.avatar_config as AvatarConfig | undefined) ?? null,
        keyStatus,
        loading,
        profileLoading,
        hasImgbbKey: Boolean(keyStatus?.configured),
        refreshProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
