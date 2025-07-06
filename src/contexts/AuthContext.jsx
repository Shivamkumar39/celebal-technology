import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session')));
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('profile')));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      const currentSession = data?.session;

      if (error || !currentSession?.user) {
        clearAuthData();
        setIsLoading(false);
        return;
      }

      const currentUser = currentSession.user;
      setSession(currentSession);
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('session', JSON.stringify(currentSession));

      await fetchProfile(currentUser.id);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        localStorage.setItem('user', JSON.stringify(session.user));
        localStorage.setItem('session', JSON.stringify(session));
        await fetchProfile(session.user.id);
      } else {
        clearAuthData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        await logout(); // backend profile missing -> clear everything
      } else {
        setProfile(data);
        localStorage.setItem('profile', JSON.stringify(data));

        await supabase
          .from('profiles')
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    } catch {
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { data: existing, error: emailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);

      if (emailError || !existing || existing.length === 0) {
        setIsLoading(false);
        return { success: false, error: 'Email not registered. Please sign up.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      const { session, user } = data;
      setUser(user);
      setSession(session);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session', JSON.stringify(session));

      await fetchProfile(user.id);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Unexpected login error.' };
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);

      if (existing?.length > 0) {
        setIsLoading(false);
        return { success: false, error: 'Email already registered. Please log in.' };
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signUpError) {
        setIsLoading(false);
        return { success: false, error: signUpError.message };
      }

      const { session, user } = data;

      if (!session || !user) {
        setIsLoading(false);
        return { success: false, error: 'Please verify your email before logging in.' };
      }

      setUser(user);
      setSession(session);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session', JSON.stringify(session));

      await fetchProfile(user.id);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Unexpected registration error.' };
    }
  };

  const logout = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
    await supabase.auth.signOut();
    clearAuthData();
  };

  const clearAuthData = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('profile');
  };

  const updateProfile = async (updates) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select();

    if (!error && data?.length) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!user && !!profile,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
