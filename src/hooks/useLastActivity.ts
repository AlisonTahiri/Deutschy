import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'dardha_last_activity';

export function useLastActivity() {
    const location = useLocation();

    useEffect(() => {
        // Only track if we are in an exercise path
        if (location.pathname.startsWith('/exercise/')) {
            localStorage.setItem(STORAGE_KEY, location.pathname);
        }
    }, [location]);

    const getLastActivity = () => {
        return localStorage.getItem(STORAGE_KEY);
    };

    const clearLastActivity = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    return { getLastActivity, clearLastActivity };
}
