import { useState, useEffect, useRef } from 'react';
import { SocialLoginService } from '../services/auth/SocialLoginService';
import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    List,
    ListItem,
    Button,
    Progressbar,
    Preloader,
    Radio,
    Checkbox,
} from 'konsta/react';
import {
    AlertCircle,
    Apple,
    UserCircle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const motivationOptions = [
    { id: 'work', label: 'Punë', emoji: '💼' },
    { id: 'family', label: 'Bashkim Familjar', emoji: '👨‍👩‍👧' },
    { id: 'exam', label: 'Provim Zyrtar', emoji: '📜' },
    { id: 'daily', label: 'Jetë e përditshme', emoji: '📅' },
];

const levelOptions = [
    { id: 'beginner', label: 'Fillestar (Zero)', desc: 'Nuk di asnjë fjalë Gjermanisht' },
    { id: 'elementary', label: 'Pak njohuri (A1/A2)', desc: 'Di disa fjalë dhe fraza bazike' },
    { id: 'intermediate', label: 'Mund të komunikoj (B1+)', desc: 'Mund të mbaj biseda të thjeshta' },
];

const commitmentOptions = [
    { id: '5', label: '5 min', badge: 'Lehtë', desc: 'Vetëm disa minuta në ditë' },
    { id: '15', label: '15 min', badge: 'Rekomanduar', desc: 'Ecuri e qëndrueshme dhe e sigurt' },
    { id: '30', label: '30 min', badge: 'Intensive', desc: 'Mëso sa më shpejt të jetë e mundur' },
];

const aiLoadingTexts = [
    'Po analizojmë profilin tënd...',
    'Po përgatisim fjalorin e punës...',
    'Plani yt është gati!',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Onboarding({ onComplete }: OnboardingProps) {
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
            setLoadingTextIdx(i => (i + 1) % aiLoadingTexts.length);
        }, 2000);

        advanceTimer.current = setTimeout(() => {
            clearInterval(loadingTimer.current!);
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
            // Note: onComplete() is NOT called here. 
            // The App component will handle the transition once the Supabase session is updated.
        } catch (err: any) {
            setAuthError(err.message || 'Diçka shkoi keq. Ju lutemi provoni përsëri.');
        } finally {
            setAuthLoading(null);
        }
    };

    return (
        <Page className="bg-(--bg-color)">
            <Navbar
                title={step >= 2 && step <= 4 ? `Hapi ${step - 1} nga 3` : (step === 1 ? 'Fillimi' : 'Mirë se vini')}
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

                    {/* Step 1: Existing Account Check */}
                    {step === 1 && (
                        <div className="animate-[fadeIn_0.4s_ease-out]">
                            <div className="flex flex-col items-center text-center gap-4 mb-10">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl bg-(--accent-color) shadow-2xl shadow-(--accent-color)/30">
                                    <UserCircle size={48} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-bold leading-tight text-(--text-primary)">
                                    Mirë se vini në Dardha!
                                </h1>
                                <p className="text-base text-(--text-secondary) px-4">
                                    A keni një llogari ekzistuese dhe po kyçeni nga një pajisje tjetër?
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 mb-8">
                                <Button
                                    large
                                    rounded
                                    onClick={() => onComplete()}
                                    className="bg-(--accent-color) text-white flex items-center justify-center gap-3 h-16 text-lg font-semibold shadow-lg shadow-(--accent-color)/20"
                                >
                                    Po, kam një llogari
                                </Button>
                                <Button
                                    large
                                    rounded
                                    outline
                                    onClick={() => setStep(2)}
                                    className="border-2 border-(--border-color) text-(--text-primary) flex items-center justify-center gap-3 h-16 text-lg font-semibold"
                                >
                                    Jo, jam i ri këtu
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Motivation */}
                    {step === 2 && (
                        <div className="animate-[fadeIn_0.4s_ease-out]">
                            <BlockTitle large className="text-center px-0">Pse dëshiron të mësosh Gjermanisht?</BlockTitle>
                            <Block className="text-center text-(--text-secondary)">
                                Zgjidhni motivimin tuaj kryesor.
                            </Block>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {motivationOptions.map(opt => (
                                    <Button
                                        key={opt.id}
                                        onClick={() => setData(d => ({ ...d, motivation: opt.id }))}
                                        outline={data.motivation !== opt.id}
                                        className={`flex flex-col items-center justify-center gap-3 p-5 h-auto rounded-2xl border-2 transition-all duration-200 ${data.motivation === opt.id
                                            ? 'border-(--accent-color) bg-(--accent-color)/10'
                                            : 'border-(--border-color) bg-(--bg-card)'
                                            }`}
                                    >
                                        <span className="text-3xl">{opt.emoji}</span>
                                        <span className={`text-sm font-semibold text-center leading-tight ${data.motivation === opt.id ? 'text-(--accent-color)' : 'text-(--text-primary)'}`}>
                                            {opt.label}
                                        </span>
                                    </Button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    large
                                    rounded
                                    outline
                                    onClick={handleBack}
                                    className="flex-1"
                                >
                                    Kthehu
                                </Button>
                                <Button
                                    large
                                    rounded
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    className="flex-2"
                                >
                                    Vazhdo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Level */}
                    {step === 3 && (
                        <div className="animate-[fadeIn_0.4s_ease-out]">
                            <BlockTitle large className="text-center">Sa është njohuria jote aktuale?</BlockTitle>
                            <Block className="text-center text-(--text-secondary)">
                                Zgjidhni nivelin që ju përshkruan.
                            </Block>

                            <List strong inset className="m-0 mb-8 overflow-hidden rounded-2xl border-0 shadow-lg">
                                {levelOptions.map(opt => (
                                    <ListItem
                                        key={opt.id}
                                        link
                                        onClick={() => setData(d => ({ ...d, level: opt.id }))}
                                        title={opt.label}
                                        subtitle={opt.desc}
                                        media={
                                            <Radio
                                                component="div"
                                                checked={data.level === opt.id}
                                                onChange={() => setData(d => ({ ...d, level: opt.id }))}
                                            />
                                        }
                                        className="bg-(--bg-card)"
                                    />
                                ))}
                            </List>

                            <div className="flex gap-4">
                                <Button
                                    large
                                    rounded
                                    outline
                                    onClick={handleBack}
                                    className="flex-1"
                                >
                                    Kthehu
                                </Button>
                                <Button
                                    large
                                    rounded
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    className="flex-2"
                                >
                                    Vazhdo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Daily Commitment */}
                    {step === 4 && (
                        <div className="animate-[fadeIn_0.4s_ease-out]">
                            <BlockTitle large >Sa minuta në ditë mund të mësosh?</BlockTitle>
                            <Block className="text-center text-(--text-secondary)">
                                Zgjidhni angazhimin tuaj ditor.
                            </Block>

                            <List strong inset className="m-0 mb-8 overflow-hidden rounded-2xl border-0 shadow-lg">
                                {commitmentOptions.map(opt => (
                                    <ListItem
                                        key={opt.id}
                                        link
                                        onClick={() => setData(d => ({ ...d, commitment: opt.id }))}
                                        title={<span className="font-bold text-lg">{opt.label}</span>}
                                        after={<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.commitment === opt.id ? 'bg-(--accent-color) text-white' : 'bg-gray-200 text-gray-600'}`}>{opt.badge}</span>}
                                        subtitle={opt.desc}
                                        media={
                                            <Checkbox
                                                component="div"
                                                checked={data.commitment === opt.id}
                                                onChange={() => setData(d => ({ ...d, commitment: opt.id }))}
                                            />
                                        }
                                        className="bg-(--bg-card)"
                                    />
                                ))}
                            </List>

                            <div className="flex gap-4">
                                <Button
                                    large
                                    rounded
                                    outline
                                    onClick={handleBack}
                                    className="flex-1"
                                >
                                    Kthehu
                                </Button>
                                <Button
                                    large
                                    rounded
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    className="flex-2"
                                >
                                    Vazhdo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: AI Loading */}
                    {step === 5 && (
                        <div className="flex flex-col items-center justify-center gap-10 py-16 animate-[fadeIn_0.4s_ease-out]">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-30 h-30 rounded-full animate-ping opacity-30 bg-(--accent-color)" />
                                <div className="absolute w-40 h-40 rounded-full animate-ping opacity-20 bg-(--accent-color) [animation-delay:0.3s]" />
                                <div className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl bg-(--accent-color) shadow-xl shadow-(--accent-color)/30">
                                    🍐
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 text-center min-h-[80px]">
                                <p key={loadingTextIdx} className="text-xl font-bold animate-[fadeIn_0.4s_ease-out] text-(--text-primary)">
                                    {aiLoadingTexts[loadingTextIdx]}
                                </p>
                                <div className="flex gap-2 justify-center">
                                    {aiLoadingTexts.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === loadingTextIdx ? 'bg-(--accent-color) scale-150' : 'bg-(--border-color)'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: CTA / Sign Up */}
                    {step === 6 && (
                        <div className="animate-[fadeIn_0.4s_ease-out]">
                            <div className="flex flex-col items-center text-center gap-4 mb-10">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl bg-(--accent-color) shadow-2xl shadow-(--accent-color)/30">
                                    🍐
                                </div>
                                <h1 className="text-3xl font-bold leading-tight text-(--text-primary)">
                                    Plani yt personal është gati!
                                </h1>
                                <p className="text-base text-(--text-secondary) px-4">
                                    Krijo llogarinë falas për të ruajtur progresin dhe për të filluar mësimin.
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
                                    Vazhdo me Google
                                </Button>

                                <div className="flex items-center gap-3 my-2">
                                    <div className="flex-1 h-px bg-(--border-color)" />
                                    <span className="text-xs font-medium text-(--text-secondary)">OSE</span>
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
                                    Vazhdo me Apple
                                </Button>
                            </div>

                            <Block className="text-center text-xs text-(--text-secondary) mt-8">
                                Duke vazhduar, ju pranoni{' '}
                                <span className="underline cursor-pointer text-(--accent-color)">Kushtet e Shërbimit</span>
                                {' '}dhe{' '}
                                <span className="underline cursor-pointer text-(--accent-color)">Politikën e Privatësisë</span>.
                            </Block>
                        </div>
                    )}
                </div>
            </div>
        </Page >
    );
}
