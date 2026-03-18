import { useState, useEffect } from 'react';
import { dbService } from '../services/db/provider';
import { useAuth } from '../hooks/useAuth';
import { CloudOff, CloudUpload, Loader2, CheckCircle2 } from 'lucide-react';

export function SyncStatusIndicator() {
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [status, setStatus] = useState<'synced' | 'syncing' | 'offline' | 'pending'>('synced');

    const checkPending = async () => {
        if (!user?.id) return;
        try {
            const pending = await dbService.getPendingSyncs(user.id);
            setPendingCount(pending.length);
            
            if (pending.length === 0) {
                setStatus('synced');
            } else if (!navigator.onLine) {
                setStatus('offline');
            } else {
                setStatus('pending');
            }
        } catch (e) {
            console.error('Error checking sync status:', e);
        }
    };

    useEffect(() => {
        checkPending();

        const handleUpdate = () => {
            checkPending();
        };

        const handleSyncStateChanged = () => {
            checkPending();
        };

        const handleOnline = () => setStatus(prev => prev === 'offline' ? 'pending' : prev);
        const handleOffline = () => setStatus('offline');

        window.addEventListener('local-db-updated', handleUpdate);
        window.addEventListener('sync-status-changed', handleSyncStateChanged);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Also check periodically just in case
        const interval = setInterval(checkPending, 30000);

        return () => {
            window.removeEventListener('local-db-updated', handleUpdate);
            window.removeEventListener('sync-status-changed', handleSyncStateChanged);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [user?.id]);

    if (!user) return null;

    let icon = <CheckCircle2 size={18} className="text-(--success-color)" />;
    let tooltip = 'All progress synced securely.';

    if (status === 'syncing') {
        icon = <Loader2 size={18} className="animate-spin text-(--accent-color)" />;
        tooltip = 'Syncing progress to cloud...';
    } else if (status === 'offline') {
        icon = <CloudOff size={18} className="text-(--danger-color)" />;
        tooltip = `${pendingCount} item(s) pending sync. You are offline.`;
    } else if (status === 'pending') {
        icon = <CloudUpload size={18} className="text-(--warning-color) animate-pulse" />;
        tooltip = `${pendingCount} item(s) pending sync. They will sync automatically.`;
    }

    // A fallback if Tooltip doesn't exist, we just render the icon with a title
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--bg-card) border border-(--border-card) shadow-sm cursor-help" title={tooltip}>
            {icon}
            {pendingCount > 0 && <span className="text-xs font-semibold text-(--text-secondary)">{pendingCount}</span>}
        </div>
    );
}
