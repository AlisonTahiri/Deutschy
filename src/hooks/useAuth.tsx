import { useState, useEffect, createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dbService } from '../services/db/provider';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'member' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string, mounted: boolean) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data && mounted) setRole(data.role);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (mounted) setRole(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id, mounted).finally(() => {
                        if (mounted) setIsLoading(false);
                    });
                } else {
                    setRole(null);
                    setIsLoading(false);
                }
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (mounted) {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        setIsLoading(true);
                        fetchProfile(newSession.user.id, mounted).finally(() => {
                            if (mounted) setIsLoading(false);
                        });
                    }
                } else {
                    setRole(null);
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        setRole(null);
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
