import { supabase } from '../../lib/supabase';

export class SocialLoginService {
    static async initialize() {
        // Initialization no longer needed for Web OAuth
    }

    static async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return data;
    }

    static async signInWithApple() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sends a magic-link (OTP) to the user's email address.
     * The user clicks the link to sign in – no password required.
     */
    static async signInWithEmail(email: string) {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
    }
}
