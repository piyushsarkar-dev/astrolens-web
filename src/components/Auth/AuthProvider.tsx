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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
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
      setProfile((data as Profile | null) ?? null);
    } catch {
      setProfile(null);
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
      setKeyStatus(json?.data ?? { configured: false, last4: null });
    } catch {
      setKeyStatus({ configured: false, last4: null });
    }
  }, []);
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
    await fetchKeyStatus();
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
      setUser(data.user);
      setLoading(false);
      if (data.user) {
        void fetchProfile(data.user.id);
        void fetchKeyStatus();
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user.id);
        void fetchKeyStatus();
      } else {
        setProfile(null);
        setKeyStatus(null);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
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
