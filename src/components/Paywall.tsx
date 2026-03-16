import { useState, useEffect } from 'react';
import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    Button,
    Preloader,
} from 'konsta/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
                // Mocking packages for web environment
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
            <Page>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <Preloader className="w-12 h-12" />
                    <p className="mt-4 text-(--text-secondary)">Loading Options...</p>
                </div>
            </Page>
        );
    }

    return (
        <Page className="bg-(--bg-color)">
            <Navbar title="Abonimi" />

            <div className="max-w-xl mx-auto pb-12">
                <Block className="text-center pt-8">
                    <BlockTitle large className="text-4xl m-0 text-(--text-primary)">Unlock German B2</BlockTitle>
                    <p className="text-lg mt-4 text-(--text-secondary)">
                        Get full access to all lessons, interactive AI exercises, and complete vocabulary tracking.
                    </p>
                </Block>

                <Block strong inset className="m-4 bg-(--bg-card) border border-(--border-color) rounded-2xl shadow-sm">
                    <div className="flex flex-col gap-4 py-2">
                        {[
                            'Complete B2 Vocabulary Course',
                            'Interactive Reading & Listening',
                            'Progress Tracking & Analytics',
                            'Unlimited AI Generation',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 size={20} className="text-(--success-color) shrink-0" />
                                <span className="text-(--text-primary) font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </Block>

                {error && (
                    <Block strong inset className="bg-red-50 text-red-600 border border-red-200 m-4 p-4 flex items-center gap-2 rounded-xl text-sm">
                        <AlertCircle size={20} />
                        <span className="flex-1">{error}</span>
                    </Block>
                )}

                <BlockTitle>Zgjidhni një plan</BlockTitle>
                <div className="px-4 flex flex-col gap-4">
                    {packages.map((pkg) => (
                        <Button
                            key={pkg.identifier}
                            disabled={isPurchasing}
                            onClick={() => handlePurchase(pkg)}
                            className="h-auto p-0 m-0 overflow-hidden shadow-sm border border-(--border-color) rounded-2xl bg-(--bg-card)"
                            clear
                        >
                            <div className="flex items-center justify-between w-full p-6 text-left">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xl font-bold text-(--text-primary)">
                                        {pkg.product.title.replace(/\(.*\)/, '').trim()}
                                    </span>
                                    <span className="text-sm text-(--text-secondary)">
                                        {pkg.packageType === 'LIFETIME' ? 'Pagesë njëherë' : `Faturuar në muaj`}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-(--accent-color)">
                                        {pkg.product.priceString}
                                    </span>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>

                {isPurchasing && (
                    <Block className="text-center">
                        <div className="flex items-center justify-center gap-3 text-(--text-secondary)">
                            <Preloader className="w-5 h-5" />
                            <span>Duke procesuar blerjen...</span>
                        </div>
                    </Block>
                )}
            </div>
        </Page>
    );
}
