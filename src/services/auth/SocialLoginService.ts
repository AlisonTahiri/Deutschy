import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';

export class SocialLoginService {
    static async initialize() {
        if (Capacitor.isNativePlatform()) {
            await SocialLogin.initialize({
                google: {
                    webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                },
            });
        }
    }

    static async signInWithGoogle() {
        try {
            if (Capacitor.isNativePlatform()) {
                const result = await SocialLogin.login({
                    provider: 'google',
                    options: {
                        scopes: ['email', 'profile'],
                    },
                });

                const res = result.result as any;
                if (res.idToken) {
                    // Send the idToken to Supabase
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: res.idToken,
                    });

                    if (error) throw error;
                    return data;
                } else {
                    throw new Error("No ID token received from Google native login");
                }
            } else {
                // Fallback to Web OAuth
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        // Can add redirectTo here if needed
                    }
                });
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    }
}
