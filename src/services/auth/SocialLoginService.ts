import { supabase } from '../../lib/supabase';

export class SocialLoginService {
    static async initialize() {
        // Initialization no longer needed for Web OAuth
    }

    static async signInWithGoogle() {
        try {
            // Web OAuth
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Can add redirectTo here if needed
                }
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    }
}
