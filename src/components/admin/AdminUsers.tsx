import { useState, useEffect, useCallback } from 'react';
import { Users, ChevronRight, Search, Shield, X, Check, Loader2, RefreshCw } from 'lucide-react';
import { adminUserService, type AdminUser } from '../../services/adminUserService';

interface Level {
    id: string;
    name: string;
    is_free: boolean;
    order_index: number;
}

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingAccess, setPendingAccess] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [u, l] = await Promise.all([
                adminUserService.getAllUsersWithAccess(),
                adminUserService.getAllLevels(),
            ]);
            setUsers(u);
            setLevels(l);
        } catch (err: any) {
            setError(err.message || 'Gabim gjatë ngarkimit');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openUser = (user: AdminUser) => {
        setSelectedUser(user);
        const accessIds = new Set(user.granted_access.map(a => a.level_id));
        setPendingAccess(accessIds);
        setSuccess(null);
        setError(null);
    };

    const closeModal = () => {
        setSelectedUser(null);
        setPendingAccess(new Set());
    };

    const toggleLevel = (levelId: string, isFree: boolean) => {
        if (isFree) return; // Nivelet falas nuk mund të hiqen
        setPendingAccess(prev => {
            const next = new Set(prev);
            if (next.has(levelId)) next.delete(levelId);
            else next.add(levelId);
            return next;
        });
    };

    const saveAccess = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!selectedUser) return;
        setIsSaving(true);
        setError(null);
        try {
            const currentAccess = new Set(selectedUser.granted_access.map(a => a.level_id));
            await adminUserService.updateUserAccess(selectedUser.id, currentAccess, pendingAccess);

            // Refresh user-in në listë
            const updated = await adminUserService.getAllUsersWithAccess();
            setUsers(updated);
            const refreshed = updated.find(u => u.id === selectedUser.id);
            if (refreshed) setSelectedUser(refreshed);

            setSuccess('Aksesi u ruajt me sukses!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Gabim gjatë ruajtjes');
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return (
            u.email?.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q) ||
            u.first_name?.toLowerCase().includes(q)
        );
    });

    const getUserInitials = (u: AdminUser) => {
        const name = u.full_name || u.first_name || u.email || '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getDisplayName = (u: AdminUser) =>
        u.full_name || u.first_name || u.email || 'User i panjohur';

    const hasChanges = selectedUser
        ? (() => {
            const current = new Set(selectedUser.granted_access.map(a => a.level_id));
            if (current.size !== pendingAccess.size) return true;
            for (const id of current) if (!pendingAccess.has(id)) return true;
            return false;
        })()
        : false;

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-(--accent-color)/10 flex items-center justify-center">
                        <Users size={20} className="text-(--accent-color)" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold m-0">Menaxhimi i Përdoruesve</h2>
                        <p className="text-(--text-secondary) text-sm m-0">{users.length} përdorues total</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-(--border-color) text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-all cursor-pointer bg-(--bg-card) disabled:opacity-50"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Rifresko
                </button>
            </div>

            {error && <div className="text-(--danger-color) p-3 bg-(--danger-color)/10 border border-(--danger-color)/20 rounded-xl text-sm">{error}</div>}

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Kërko me email ose emër..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--border-color) bg-(--bg-card) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent-color) transition-colors"
                />
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-(--accent-color)" size={32} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-(--text-secondary)">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Nuk u gjet asnjë përdorues.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-(--border-color) overflow-hidden bg-(--bg-card)">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-(--border-color) text-(--text-secondary) text-xs uppercase tracking-wide">
                                <th className="text-left p-3 pl-4">Përdoruesi</th>
                                <th className="text-left p-3 hidden md:table-cell">Email</th>
                                <th className="text-left p-3">Nivelet</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {filtered.map(user => {
                                const paidAccess = user.granted_access.filter(a => !a.is_free);
                                return (
                                    <tr
                                        key={user.id}
                                        onClick={() => openUser(user)}
                                        className="hover:bg-(--bg-color-secondary)/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-3 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-(--accent-color)/10 flex items-center justify-center text-(--accent-color) font-bold text-xs flex-shrink-0">
                                                    {getUserInitials(user)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-(--text-primary)">{getDisplayName(user)}</div>
                                                    {user.role === 'admin' && (
                                                        <div className="flex items-center gap-1 text-(--accent-color) text-xs">
                                                            <Shield size={10} />
                                                            Admin
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-(--text-secondary) hidden md:table-cell">{user.email}</td>
                                        <td className="p-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {levels.filter(l => l.is_free).map(l => (
                                                    <span key={l.id} className="text-xs px-2 py-0.5 rounded-full bg-(--success-color)/10 text-(--success-color) border border-(--success-color)/20">
                                                        {l.name} ✓
                                                    </span>
                                                ))}
                                                {paidAccess.map(a => (
                                                    <span key={a.level_id} className="text-xs px-2 py-0.5 rounded-full bg-(--accent-color)/10 text-(--accent-color) border border-(--accent-color)/20">
                                                        {a.level_name} ✓
                                                    </span>
                                                ))}
                                                {paidAccess.length === 0 && (
                                                    <span className="text-xs text-(--text-secondary)">Vetëm falas</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <ChevronRight size={16} className="text-(--text-secondary) group-hover:text-(--text-primary) transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal: Detaje User */}
            {selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="bg-(--bg-color) border border-(--border-color) rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-(--border-color)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-(--accent-color)/10 flex items-center justify-center text-(--accent-color) font-bold">
                                    {getUserInitials(selectedUser)}
                                </div>
                                <div>
                                    <div className="font-bold text-(--text-primary)">{getDisplayName(selectedUser)}</div>
                                    <div className="text-xs text-(--text-secondary)">{selectedUser.email}</div>
                                </div>
                            </div>
                            <button type="button" onClick={closeModal} className="p-2 rounded-xl hover:bg-(--bg-color-secondary) transition-colors cursor-pointer">
                                <X size={18} className="text-(--text-secondary)" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 flex flex-col gap-4">
                            <p className="text-sm font-semibold text-(--text-primary)">Aksesi në Nivele</p>

                            {error && <div className="text-(--danger-color) text-sm p-2 bg-(--danger-color)/10 rounded-lg">{error}</div>}
                            {success && <div className="text-(--success-color) text-sm p-2 bg-(--success-color)/10 rounded-lg">{success}</div>}

                            <div className="flex flex-col gap-2">
                                {levels.map(level => {
                                    const isChecked = level.is_free || pendingAccess.has(level.id);
                                    const isFree = level.is_free;
                                    return (
                                        <div
                                            key={level.id}
                                            onClick={() => toggleLevel(level.id, isFree)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                isFree
                                                    ? 'border-(--border-color) opacity-60 cursor-not-allowed bg-(--bg-color-secondary)'
                                                    : isChecked
                                                    ? 'border-(--accent-color) bg-(--accent-color)/5 cursor-pointer'
                                                    : 'border-(--border-color) bg-(--bg-card) cursor-pointer hover:border-(--border-color-hover)'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                isChecked
                                                    ? 'border-(--accent-color) bg-(--accent-color)'
                                                    : 'border-(--border-color)'
                                            }`}>
                                                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <span className="text-sm font-medium text-(--text-primary)">{level.name}</span>
                                            {isFree && (
                                                <span className="ml-auto text-xs text-(--success-color) bg-(--success-color)/10 px-2 py-0.5 rounded-full">Falas</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-2 p-5 pt-0">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl border border-(--border-color) text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-all cursor-pointer"
                            >
                                Anulo
                            </button>
                            <button
                                type="button"
                                onClick={saveAccess}
                                disabled={isSaving || !hasChanges}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: 'var(--accent-color)', color: '#fff' }}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Ruaj Akseset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
