import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface MockPackage {
    identifier: string;
    packageType: string;
    product: {
        identifier: string;
        description: string;
        title: string;
        price: number;
        priceString: string;
        currencyCode: string;
        productCategory: string;
    }
}

interface PaywallProps {
    onPurchaseSuccess: () => Promise<void>;
}

export function Paywall({ onPurchaseSuccess }: PaywallProps) {
    const [packages, setPackages] = useState<MockPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOfferings = async () => {
            try {
                setIsLoading(true);
                console.log('[Paywall] Mocking packages for web environment');
                setPackages([
                    { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'monthly', description: 'Monthly subscription', title: 'Monthly', price: 9.99, priceString: '$9.99', currencyCode: 'USD', productCategory: 'SUBSCRIPTION' } },
                    { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'yearly', description: 'Yearly subscription', title: 'Yearly', price: 99.99, priceString: '$99.99', currencyCode: 'USD', productCategory: 'SUBSCRIPTION' } },
                    { identifier: '$rc_lifetime', packageType: 'LIFETIME', product: { identifier: 'lifetime', description: 'Lifetime access', title: 'Lifetime', price: 199.99, priceString: '$199.99', currencyCode: 'USD', productCategory: 'NON_SUBSCRIPTION' } },
                ]);
            } catch (err: any) {
                setError(`Failed to load subscription options: ${err.message || 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOfferings();
    }, []);

    const handlePurchase = async (_pkg: MockPackage) => {
        try {
            setIsPurchasing(true);
            setError(null);
            console.log('[Paywall] Web environment: mocking successful purchase');
            await new Promise(resolve => setTimeout(resolve, 1500));
            await onPurchaseSuccess();
        } catch (err: any) {
            if (err.userCancelled) {
                console.log('User cancelled purchase');
            } else {
                console.error('Purchase failed:', err);
                setError(`Purchase failed: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 animate-[fadeIn_0.4s_ease-out] h-full p-8">
                <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
                <h2 style={{ color: 'var(--text-primary)' }}>Loading Options...</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center animate-[fadeIn_0.4s_ease-out] text-center h-full px-4 py-8" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>Unlock German B2</h1>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                Get full access to all lessons, interactive AI exercises, and complete vocabulary tracking.
            </p>

            <div className="flex flex-col gap-2 w-full max-w-md mb-8 text-left">
                {[
                    'Complete B2 Vocabulary Course',
                    'Interactive Reading & Listening',
                    'Progress Tracking & Analytics',
                    'Unlimited AI Generation',
                ].map((feature, i) => (
                    <div key={i} className="flex flex-row items-center gap-4">
                        <CheckCircle2 size={20} color="var(--success-color)" />
                        <span style={{ color: 'var(--text-primary)' }}>{feature}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="flex flex-row items-center gap-2 rounded-xl p-4 mb-8 w-full" style={{ backgroundColor: 'rgba(218, 54, 51, 0.1)', color: 'var(--danger-color)' }}>
                    <AlertCircle size={20} />
                    <span className="text-sm text-left">{error}</span>
                </div>
            )}

            <div className="flex flex-col gap-4 w-full">
                {packages.map((pkg) => (
                    <button
                        key={pkg.identifier}
                        disabled={isPurchasing}
                        onClick={() => handlePurchase(pkg)}
                        className="flex flex-row justify-between items-center w-full rounded-3xl p-6 border cursor-pointer transition-all hover:scale-[1.01] disabled:opacity-70"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-accent-subtle)' }}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {pkg.product.title.replace(/\(.*\)/, '').trim()}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {pkg.packageType === 'LIFETIME' ? 'One-time payment' : `Billed ${pkg.packageType.toLowerCase()}`}
                            </span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>
                                {pkg.product.priceString}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {isPurchasing && (
                <div className="flex flex-row items-center gap-2 mt-6" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing purchase...</span>
                </div>
            )}
        </div>
    );
}
