import { useTranslation, Trans } from 'react-i18next';
import { Block, Button, Preloader } from 'konsta/react';
import { AlertCircle, Apple } from 'lucide-react';

interface SignUpStepProps {
    authAction: (provider: 'google' | 'apple') => Promise<void>;
    authLoading: 'google' | 'apple' | null;
    authError: string | null;
}

export function SignUpStep({ authAction, authLoading, authError }: SignUpStepProps) {
    const { t } = useTranslation();

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="flex flex-col items-center text-center gap-4 mb-10">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl bg-(--accent-color) shadow-2xl shadow-(--accent-color)/30">
                    🍐
                </div>
                <h1 className="text-3xl font-bold leading-tight text-(--text-primary)">
                    {t('onboarding.planReady')}
                </h1>
                <p className="text-base text-(--text-secondary) px-4">
                    {t('onboarding.createAccountDesc')}
                </p>
            </div>

            {authError && (
                <Block strong inset className="bg-(--danger-color)/10 text-(--danger-color) border border-(--danger-color)/20 m-0 mb-6 p-3 flex items-center gap-2 rounded-xl text-sm">
                    <AlertCircle size={18} />
                    <span>{authError}</span>
                </Block>
            )}

            <div className="flex flex-col gap-4">
                <Button
                    large
                    rounded
                    onClick={() => authAction('google')}
                    disabled={!!authLoading}
                    className="bg-(--bg-card) text-(--text-primary) border border-(--border-color) flex items-center justify-center gap-3 h-14"
                >
                    {authLoading === 'google' ? (
                        <Preloader className="w-5 h-5" />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    {t('auth.continueWithGoogle')}
                </Button>

                <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-(--border-color)" />
                    <span className="text-xs font-medium text-(--text-secondary)">{t('auth.or')}</span>
                    <div className="flex-1 h-px bg-(--border-color)" />
                </div>

                <Button
                    large
                    rounded
                    onClick={() => authAction('apple')}
                    disabled={!!authLoading}
                    className="bg-(--bg-card) text-(--text-primary) border border-(--border-color) flex items-center justify-center gap-3 h-14"
                >
                    {authLoading === 'apple' ? (
                        <Preloader className="w-5 h-5" />
                    ) : (
                        <Apple size={20} />
                    )}
                    {t('auth.continueWithApple')}
                </Button>
            </div>

            <Block className="text-center text-xs text-(--text-secondary) mt-8">
                <Trans i18nKey="auth.byContinuing">
                    Duke vazhduar, ju pranoni{' '}
                    <span className="underline cursor-pointer text-(--accent-color)">Kushtet e Shërbimit</span>
                    {' '}dhe{' '}
                    <span className="underline cursor-pointer text-(--accent-color)">Politikën e Privatësisë</span>.
                </Trans>
            </Block>
        </div>
    );
}
