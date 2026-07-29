import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser]   = useState(null);   // raw Supabase auth user
  const [profile,  setProfile]    = useState(null);   // profiles table row
  const [loading,  setLoading]    = useState(true);   // true until first session check done
  const [profileLoading, setProfLoad] = useState(false); // true while fetching profile row
  const mountedRef = useRef(true);

  // ── Fetch profile row from DB ──────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    setProfLoad(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!mountedRef.current) return null;
    if (!error && data) setProfile(data);
    else setProfile(null);
    setProfLoad(false);
    return data ?? null;
  }, []);

  // ── Single source of truth: onAuthStateChange ──────────────────────────────
  // We do NOT manually call setUser after login/signup — we let the listener
  // handle ALL state updates so there are no race conditions.
  useEffect(() => {
    mountedRef.current = true;

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      if (session?.user) {
        setAuthUser(session.user);
        fetchProfile(session.user.id).then(() => {
          if (mountedRef.current) setLoading(false);
        });
      } else {
        setAuthUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for all future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setAuthUser(session.user);
        // Only re-fetch profile on actual sign-in / token refresh events
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'PASSWORD_RECOVERY'
        ) {
          fetchProfile(session.user.id).then(() => {
            if (mountedRef.current) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Email / Password Login ─────────────────────────────────────────────────
  // We call signInWithPassword and WAIT for the profile to be fetched before
  // returning success, so the caller can navigate immediately.
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    // onAuthStateChange will fire SIGNED_IN but we also fetch here so the
    // caller doesn't have to wait for the listener cycle.
    const prof = await fetchProfile(data.user.id);
    setAuthUser(data.user);
    setProfile(prof);
    setLoading(false);

    return { success: true };
  };

  // ── Email / Password Sign-up ───────────────────────────────────────────────
  const signup = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
      },
    });
    if (error) return { success: false, error: error.message };
    // needsConfirmation = true means email confirm is enabled and no session yet
    return { success: true, user: data.user, needsConfirmation: !data.session };
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // ── Reset Password ─────────────────────────────────────────────────────────
  const resetPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // ── Update Profile ─────────────────────────────────────────────────────────
  const updateProfile = async (fields) => {
    const uid = authUser?.id;
    if (!uid) return { success: false, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', uid)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    setProfile(data);
    return { success: true, profile: data };
  };

  // ── Upload Avatar ──────────────────────────────────────────────────────────
  const uploadAvatar = async (file) => {
    const uid = authUser?.id;
    if (!uid) return { success: false, error: 'Not authenticated' };
    const ext  = file.name.split('.').pop();
    const path = `${uid}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '0' });
    if (uploadError) return { success: false, error: uploadError.message };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    return updateProfile({ avatar_url: avatarUrl });
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT will clear state
  };

  // ── Refresh profile manually ───────────────────────────────────────────────
  const refreshProfile = () => authUser && fetchProfile(authUser.id);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isAdmin     = profile?.role === 'admin';
  const isOrganizer = profile?.role === 'organizer' || isAdmin;

  // currentUser merges auth email with profile data.
  // It is null until BOTH authUser and profile are loaded.
  const currentUser = authUser && profile ? { ...profile, email: authUser.email } : null;

  // The app is "ready" (not loading) when:
  // - Initial session check is done (loading = false) AND
  // - Profile fetch is not in progress
  const isFullyReady = !loading && !profileLoading;

  return (
    <AuthContext.Provider value={{
      user:     currentUser,
      authUser,
      profile,
      loading:  !isFullyReady,
      isAdmin,
      isOrganizer,
      login,
      loginWithGoogle,
      signup,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      uploadAvatar,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
