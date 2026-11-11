import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

const DEMO_ADMIN_KEY = 'CAMPUS_ADMIN_2025';
const LOCAL_STORAGE_USERS = 'campus_ai_users';
const LOCAL_STORAGE_SESSION = 'campus_ai_current_session';

// Initial preloaded seed accounts for effortless testing in demo mode
const INITIAL_DEMO_USERS = [
  {
    id: 'demo-admin-id-01',
    email: 'admin@campus.edu',
    password: 'AdminPassword123!',
    full_name: 'Dr. Sarah Jenkins (Admin)',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-student-id-01',
    email: 'student@campus.edu',
    password: 'StudentPassword123!',
    full_name: 'Rahul Sharma',
    role: 'student',
    created_at: new Date().toISOString()
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize demo users storage if not present
  useEffect(() => {
    if (!localStorage.getItem(LOCAL_STORAGE_USERS)) {
      localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(INITIAL_DEMO_USERS));
    }
  }, []);

  // Check initial session
  useEffect(() => {
    async function initSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email,
                full_name: profile.full_name,
                role: profile.role
              });
            }
          }
        } else {
          // Check local mock session
          const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION);
          if (savedSession) {
            setUser(JSON.parse(savedSession));
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              full_name: profile.full_name,
              role: profile.role
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  /**
   * Sign in handler with strict role verification
   */
  async function signIn({ email, password, expectedRole }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Authentication failed');

      // Verify profile and role
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact administration.');
      }

      if (expectedRole && profile.role !== expectedRole) {
        await supabase.auth.signOut();
        throw new Error(
          `Unauthorized: This account has the "${profile.role}" role and cannot log into the ${expectedRole} portal.`
        );
      }

      const activeUser = {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        role: profile.role
      };
      setUser(activeUser);
      return activeUser;
    } else {
      // Mock / Offline authentication
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS) || '[]');
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!found || found.password !== password) {
        throw new Error('Invalid email or password.');
      }

      if (expectedRole && found.role !== expectedRole) {
        throw new Error(
          `Unauthorized: This account has the "${found.role}" role and cannot log into the ${expectedRole} portal.`
        );
      }

      const activeUser = {
        id: found.id,
        email: found.email,
        full_name: found.full_name,
        role: found.role
      };
      localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(activeUser));
      setUser(activeUser);
      return activeUser;
    }
  }

  /**
   * Register Student
   */
  async function signUpStudent({ email, password, username }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username,
            role: 'student'
          }
        }
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Student registration failed');

      // Insert profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: username,
            role: 'student'
          }
        ]);

      if (profileErr && !profileErr.message.includes('duplicate')) {
        console.warn('Profile insert notice:', profileErr.message);
      }

      const newUser = {
        id: data.user.id,
        email,
        full_name: username,
        role: 'student'
      };
      return newUser;
    } else {
      // Demo mode
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS) || '[]');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with this email address already exists.');
      }

      const newUser = {
        id: 'student-' + Date.now(),
        email,
        password,
        full_name: username,
        role: 'student',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(users));
      return newUser;
    }
  }

  /**
   * Register Admin with Authorization Code
   */
  async function signUpAdmin({ email, password, fullName, inviteCode }) {
    const validInvite = import.meta.env.VITE_ADMIN_INVITE_CODE || DEMO_ADMIN_KEY;
    if (inviteCode !== validInvite) {
      throw new Error('Access Denied: Invalid Admin Provisioning Key. Public administrator registration is prohibited.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin'
          }
        }
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Admin registration failed');

      const { error: profileErr } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'admin'
          }
        ]);

      if (profileErr && !profileErr.message.includes('duplicate')) {
        console.warn('Profile insert notice:', profileErr.message);
      }

      const newAdmin = {
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'admin'
      };
      return newAdmin;
    } else {
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS) || '[]');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An administrator account with this email already exists.');
      }

      const newAdmin = {
        id: 'admin-' + Date.now(),
        email,
        password,
        full_name: fullName,
        role: 'admin',
        created_at: new Date().toISOString()
      };

      users.push(newAdmin);
      localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(users));
      return newAdmin;
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUpStudent,
        signUpAdmin,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
