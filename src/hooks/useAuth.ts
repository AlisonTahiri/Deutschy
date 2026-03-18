import { useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dbService } from '../services/db/provider';

export function useAuth() {
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

        // Get initial session
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

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    setIsLoading(true);
                    fetchProfile(session.user.id, mounted).finally(() => {
                        if (mounted) setIsLoading(false);
                    });
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

    return { session, user, role, isLoading, signOut };
}
