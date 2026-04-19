import { useState, useEffect, createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dbService } from '../services/db/provider';
import { syncService } from '../services/syncService';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: 'admin' | 'member' | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    isLoading: true,
    signOut: async () => {},
});

const ROLE_CACHE_KEY = 'deutschy_user_role';
const SUPABASE_SESSION_KEY = 'sb-' + (import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] ?? '') + '-auth-token';

/**
 * Reads the Supabase session synchronously from localStorage.
 * Supabase JS stores the session there, so this works without any network call.
 */
function getStoredSession(): Session | null {
    try {
        // Supabase v2 stores the session under a key like "sb-<project-ref>-auth-token"
        // We try the known key first, then fall back to scanning for any sb-*-auth-token key.
        let raw = localStorage.getItem(SUPABASE_SESSION_KEY);
        if (!raw) {
            // Fallback: scan localStorage for the Supabase session key
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    raw = localStorage.getItem(key);
                    break;
                }
            }
        }
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Supabase stores { access_token, refresh_token, expires_at, user, ... }
        // Reconstruct a minimal Session-compatible object
        if (parsed?.access_token && parsed?.user) {
            return parsed as Session;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Fetches the user role from Supabase with a timeout.
 * Falls back to the cached role from localStorage when offline or slow.
 */
async function fetchProfileWithFallback(userId: string): Promise<'admin' | 'member' | null> {
    const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as 'admin' | 'member' | null;

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchProfile timeout')), 5000)
    );

    try {
        const fetchPromise = supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) throw error;

        const role = data?.role as 'admin' | 'member' | null;
        // Cache the freshly fetched role for offline use
        if (role) localStorage.setItem(ROLE_CACHE_KEY, role);
        else localStorage.removeItem(ROLE_CACHE_KEY);

        return role;
    } catch {
        console.warn('fetchProfile failed (offline?), using cached role:', cachedRole);
        return cachedRole;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Bootstrap synchronously from localStorage so we never block offline
    const storedSession = getStoredSession();

    const [session, setSession] = useState<Session | null>(storedSession);
    const [user, setUser] = useState<User | null>(storedSession?.user ?? null);
    const [role, setRole] = useState<'admin' | 'member' | null>(
        // Use cached role immediately; will be refreshed async when online
        (localStorage.getItem(ROLE_CACHE_KEY) as 'admin' | 'member' | null)
    );
    // If we already have a stored session, we're ready immediately (no loading required).
    const [isLoading, setIsLoading] = useState(!storedSession);

    useEffect(() => {
        let mounted = true;

        // Kick off the async Supabase session check in the background.
        // This will refresh the token when online, but we don't block on it.
        supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
            if (!mounted) return;
            setSession(freshSession);
            setUser(freshSession?.user ?? null);

            if (freshSession?.user) {
                // If we had no stored session initially, fetch profile (loading was true).
                // Either way, refresh role in background.
                fetchProfileWithFallback(freshSession.user.id).then((r) => {
                    if (mounted) {
                        setRole(r);
                        setIsLoading(false); // Clears the loading screen if it was still showing
                    }
                });
            } else {
                // No session found at all
                setRole(null);
                localStorage.removeItem(ROLE_CACHE_KEY);
                setIsLoading(false);
            }
        }).catch(() => {
            // getSession failed entirely (very unusual) — unblock loading
            if (mounted) setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return;
            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    setIsLoading(true);
                    fetchProfileWithFallback(newSession.user.id).then((r) => {
                        if (mounted) {
                            setRole(r);
                            setIsLoading(false);
                        }
                    });
                }
            } else {
                setRole(null);
                localStorage.removeItem(ROLE_CACHE_KEY);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (user?.id) {
            try {
                await syncService.pushPendingProgress(user.id);
            } catch (err) {
                console.error("Failed to push progress before logout:", err);
            }
        }
        setRole(null);
        localStorage.removeItem(ROLE_CACHE_KEY);
        if (user?.id) {
            await dbService.clearUserProgress(user.id);
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
