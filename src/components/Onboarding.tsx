import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialLoginService } from '../services/auth/SocialLoginService';
import { Page, Navbar, Progressbar } from 'konsta/react';

// Sub-components
import { WelcomeStep } from './onboarding/WelcomeStep';
import { MotivationStep } from './onboarding/MotivationStep';
import { LevelStep } from './onboarding/LevelStep';
import { CommitmentStep } from './onboarding/CommitmentStep';
import { AnalyzingStep } from './onboarding/AnalyzingStep';
import { SignUpStep } from './onboarding/SignUpStep';
import { aiLoadingKeys } from './onboarding/constants';

// Types
interface OnboardingData {
    motivation: string | null;
    level: string | null;
    commitment: string | null;
}

interface OnboardingProps {
    onComplete: () => void;
}

// ─── Placeholder: sync to Supabase profiles ──────────────────────────────────
async function handleOnboardingComplete(data: OnboardingData) {
    console.log('[Onboarding] Collected profile data:', data);
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>({ motivation: null, level: null, commitment: null });
    const [loadingTextIdx, setLoadingTextIdx] = useState(0);
    const [authLoading, setAuthLoading] = useState<'google' | 'apple' | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (step !== 5) return;
        setLoadingTextIdx(0);

        loadingTimer.current = setInterval(() => {
            setLoadingTextIdx(i => (i + 1) % aiLoadingKeys.length);
        }, 2000);

        advanceTimer.current = setTimeout(() => {
            if (loadingTimer.current) clearInterval(loadingTimer.current);
            setStep(6);
        }, 6200);

        return () => {
            if (loadingTimer.current) clearInterval(loadingTimer.current);
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
        };
    }, [step]);

    const canAdvance = () => {
        if (step === 2) return !!data.motivation;
        if (step === 3) return !!data.level;
        if (step === 4) return !!data.commitment;
        return false;
    };

    const handleNext = () => {
        if (step < 4) { setStep(s => s + 1); return; }
        if (step === 4) { setStep(5); return; }
    };

    const handleBack = () => { if (step > 1 && step < 5) setStep(s => s - 1); };

    const authAction = async (provider: 'google' | 'apple') => {
        try {
            setAuthLoading(provider);
            setAuthError(null);
            await handleOnboardingComplete(data);

            if (provider === 'google') {
                await SocialLoginService.signInWithGoogle();
            } else if (provider === 'apple') {
                await SocialLoginService.signInWithApple();
            }
        } catch (err: any) {
            setAuthError(err.message || t('auth.errorFallback'));
        } finally {
            setAuthLoading(null);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <WelcomeStep onComplete={onComplete} onNewUser={() => setStep(2)} />;
            case 2:
                return (
                    <MotivationStep
                        selectedMotivation={data.motivation}
                        onSelect={(id) => setData(d => ({ ...d, motivation: id }))}
                        onNext={handleNext}
                        onBack={handleBack}
                        canAdvance={canAdvance()}
                    />
                );
            case 3:
                return (
                    <LevelStep
                        selectedLevel={data.level}
                        onSelect={(id) => setData(d => ({ ...d, level: id }))}
                        onNext={handleNext}
                        onBack={handleBack}
                        canAdvance={canAdvance()}
                    />
                );
            case 4:
                return (
                    <CommitmentStep
                        selectedCommitment={data.commitment}
                        onSelect={(id) => setData(d => ({ ...d, commitment: id }))}
                        onNext={handleNext}
                        onBack={handleBack}
                        canAdvance={canAdvance()}
                    />
                );
            case 5:
                return <AnalyzingStep loadingTextIdx={loadingTextIdx} />;
            case 6:
                return (
                    <SignUpStep
                        authAction={authAction}
                        authLoading={authLoading}
                        authError={authError}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Page className="bg-(--bg-color)">
            <Navbar
                title={step >= 2 && step <= 4 ? t('onboarding.stepOf', { current: step - 1, total: 3 }) : (step === 1 ? t('onboarding.start') : t('onboarding.welcome'))}
                className="top-0 sticky"
            />

            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--konsta-navbar-height))] p-4 pb-12">
                <div className="w-full max-w-md">
                    {step >= 2 && step <= 4 && (
                        <div className="mb-8 px-4">
                            <Progressbar
                                progress={(step - 1) / 3}
                                className="h-2 rounded-full"
                            />
                        </div>
                    )}
                    {renderStep()}
                </div>
            </div>
        </Page>
    );
}
