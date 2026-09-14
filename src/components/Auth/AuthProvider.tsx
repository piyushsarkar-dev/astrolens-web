"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  avatarUrl: string | null;
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
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);
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
      if (data.user) void fetchProfile(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [fetchProfile]);
  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured — just clear local state.
    }
    setUser(null);
    setProfile(null);
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
        loading,
        profileLoading,
        hasImgbbKey: Boolean(profile?.imgbb_api_key?.trim()),
        refreshProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
