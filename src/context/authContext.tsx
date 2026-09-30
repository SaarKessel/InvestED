import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue } from "./useAuth";
import { getSupabase } from "@/lib/account/supabaseClient";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = getSupabase();
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    loading,
    signIn: async (email, password) => (await getSupabase().auth.signInWithPassword({ email, password })).error?.message ?? null,
    signUp: async (email, password) => {
      const { data, error } = await getSupabase().auth.signUp({ email, password });
      if (error) return error.message;
      return data.session ? null : "confirm_email";
    },
    signOut: async () => { await getSupabase().auth.signOut(); },
  }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

