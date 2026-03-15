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
                // Mock data for web development
                console.log('[Paywall] Mocking packages for web environment');
                setPackages([
                    {
                        identifier: '$rc_monthly',
                        packageType: 'MONTHLY',
                        product: {
                            identifier: 'monthly',
                            description: 'Monthly subscription',
                            title: 'Monthly',
                            price: 9.99,
                            priceString: '$9.99',
                            currencyCode: 'USD',
                            productCategory: 'SUBSCRIPTION'
                        }
                    },
                    {
                        identifier: '$rc_annual',
                        packageType: 'ANNUAL',
                        product: {
                            identifier: 'yearly',
                            description: 'Yearly subscription',
                            title: 'Yearly',
                            price: 99.99,
                            priceString: '$99.99',
                            currencyCode: 'USD',
                            productCategory: 'SUBSCRIPTION'
                        }
                    },
                    {
                        identifier: '$rc_lifetime',
                        packageType: 'LIFETIME',
                        product: {
                            identifier: 'lifetime',
                            description: 'Lifetime access',
                            title: 'Lifetime',
                            price: 199.99,
                            priceString: '$199.99',
                            currencyCode: 'USD',
                            productCategory: 'NON_SUBSCRIPTION'
                        }
                    }
                ]);
            } catch (err: any) {
                console.error('Error fetching offerings:', err);
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
            // Check if it's a user cancellation (error code can vary, but standard behavior is to just ignore it)
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
            <div className="flex-column align-center justify-center gap-md animate-fade-in" style={{ height: '100%', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
                <h2 style={{ color: 'var(--text-primary)' }}>Loading Options...</h2>
            </div>
        );
    }

    return (
        <div className="flex-column align-center justify-center animate-fade-in" style={{ 
            height: '100%', 
            padding: '2rem 1rem', 
            maxWidth: '600px', 
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Unlock German B2
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Get full access to all lessons, interactive AI exercises, and complete vocabulary tracking.
            </p>

            <div className="flex-column gap-sm" style={{ width: '100%', maxWidth: '400px', marginBottom: '2rem', textAlign: 'left' }}>
                {[
                    'Complete B2 Vocabulary Course',
                    'Interactive Reading & Listening',
                    'Progress Tracking & Analytics',
                    'Unlimited AI Generation'
                ].map((feature, i) => (
                    <div key={i} className="flex-row align-center gap-md">
                        <CheckCircle2 size={20} color="var(--success-color)" />
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{feature}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="flex-row align-center gap-sm" style={{ 
                    backgroundColor: 'rgba(218, 54, 51, 0.1)', 
                    color: 'var(--danger-color)', 
                    padding: '1rem', 
                    borderRadius: 'var(--border-radius-md)',
                    marginBottom: '2rem',
                    width: '100%'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '0.9rem', textAlign: 'left' }}>{error}</span>
                </div>
            )}

            <div className="flex-column gap-md" style={{ width: '100%' }}>
                {packages.map((pkg) => (
                    <button 
                        key={pkg.identifier}
                        disabled={isPurchasing}
                        onClick={() => handlePurchase(pkg)}
                        className="btn glass-panel"
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-accent-subtle)',
                            width: '100%',
                            opacity: isPurchasing ? 0.7 : 1
                        }}
                    >
                        <div className="flex-column align-start gap-xs">
                            <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                                {pkg.product.title.replace(/\(.*\)/, '').trim()}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {pkg.packageType === 'LIFETIME' ? 'One-time payment' : `Billed ${pkg.packageType.toLowerCase()}`}
                            </span>
                        </div>
                        <div className="flex-column align-end">
                            <span style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--accent-color)' }}>
                                {pkg.product.priceString}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
            
            {isPurchasing && (
                <div className="flex-row align-center gap-sm" style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing purchase...</span>
                </div>
            )}
        </div>
    );
}
