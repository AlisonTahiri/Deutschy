import { RefreshCw, Loader2, X } from 'lucide-react';
import { glassPanel, inputField, btnPrimary } from './AdminLayout';

interface GlobalSearchProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    handleGlobalSearch: () => void;
    clearSearch: () => void;
    isSearching: boolean;
}

export function GlobalSearch({
    searchQuery,
    setSearchQuery,
    handleGlobalSearch,
    clearSearch,
    isSearching
}: GlobalSearchProps) {
    return (
        <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center p-4!`}>
            <div className="relative flex-1 w-full">
                <input
                    type="text"
                    className={inputField}
                    placeholder="Kërko fjalë gjermanisht ose shqip..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                />
                {searchQuery && (
                    <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
                        onClick={clearSearch}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
            <button 
                className={`${btnPrimary} w-full sm:w-auto shrink-0`} 
                onClick={handleGlobalSearch}
                disabled={isSearching || !searchQuery.trim()}
            >
                {isSearching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                Kërko
            </button>
        </div>
    );
}
