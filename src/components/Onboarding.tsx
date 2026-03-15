import { useState, useEffect, useRef } from 'react';
import { SocialLoginService } from '../services/auth/SocialLoginService';

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
  // TODO: Sync to Supabase `profiles` table once the user is authenticated.
  // Example:
  // const { error } = await supabase
  //   .from('profiles')
  //   .upsert({ id: user.id, motivation: data.motivation, level: data.level, commitment: data.commitment });
  console.log('[Onboarding] Collected profile data:', data);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PEAR = '#84a98c';
const PEAR_GLOW = 'rgba(132,169,140,0.35)';

const motivationOptions = [
  { id: 'work',     label: 'Punë',               emoji: '💼' },
  { id: 'family',   label: 'Bashkim Familjar',   emoji: '👨‍👩‍👧' },
  { id: 'exam',     label: 'Provim Zyrtar',       emoji: '📜' },
  { id: 'daily',    label: 'Jetë e përditshme',   emoji: '📅' },
];

const levelOptions = [
  { id: 'beginner',     label: 'Fillestar (Zero)',             desc: 'Nuk di asnjë fjalë Gjermanisht' },
  { id: 'elementary',   label: 'Pak njohuri (A1/A2)',          desc: 'Di disa fjalë dhe fraza bazike' },
  { id: 'intermediate', label: 'Mund të komunikoj (B1+)',      desc: 'Mund të mbaj biseda të thjeshta' },
];

const commitmentOptions = [
  { id: '5',   label: '5 min',  badge: 'Lehtë',         desc: 'Vetëm disa minuta në ditë' },
  { id: '15',  label: '15 min', badge: 'Rekomanduar',   desc: 'Ecuri e qëndrueshme dhe e sigurt' },
  { id: '30',  label: '30 min', badge: 'Intensive',     desc: 'Mëso sa më shpejt të jetë e mundur' },
];

const aiLoadingTexts = [
  'Po analizojmë profilin tënd...',
  'Po përgatisim fjalorin e punës...',
  'Plani yt është gati!',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  // Steps 1-3 count; steps 4-5 are non-interactive
  const pct = Math.min((step / 3) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(132,169,140,0.2)' }}>
      <div
        className="h-1.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: PEAR }}
      />
    </div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({ motivation: null, level: null, commitment: null });

  // Step 4 – AI Loading
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  // Step 5 – Auth
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [authLoading, setAuthLoading] = useState<'google' | 'apple' | 'email' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance from Step 4 after 6 seconds
  useEffect(() => {
    if (step !== 4) return;
    setLoadingTextIdx(0);

    loadingTimer.current = setInterval(() => {
      setLoadingTextIdx(i => (i + 1) % aiLoadingTexts.length);
    }, 2000);

    advanceTimer.current = setTimeout(() => {
      clearInterval(loadingTimer.current!);
      setStep(5);
    }, 6200);

    return () => {
      clearInterval(loadingTimer.current!);
      clearTimeout(advanceTimer.current!);
    };
  }, [step]);

  const canAdvance = () => {
    if (step === 1) return !!data.motivation;
    if (step === 2) return !!data.level;
    if (step === 3) return !!data.commitment;
    return false;
  };

  const handleNext = () => {
    if (step < 3) { setStep(s => s + 1); return; }
    if (step === 3) { setStep(4); return; } // trigger loading
  };

  const handleBack = () => { if (step > 1 && step < 4) setStep(s => s - 1); };

  // ── Auth handlers ────────────────────────────────────────────────────────

  const authAction = async (provider: 'google' | 'apple' | 'email') => {
    try {
      setAuthLoading(provider);
      setAuthError(null);
      await handleOnboardingComplete(data);

      if (provider === 'google') {
        await SocialLoginService.signInWithGoogle();
      } else if (provider === 'apple') {
        await SocialLoginService.signInWithApple();
      } else {
        if (!emailInput.trim() || !emailInput.includes('@')) {
          setAuthError('Ju lutemi shkruani një adresë emaili të vlefshme.');
          return;
        }
        await SocialLoginService.signInWithEmail(emailInput.trim());
        setEmailSent(true);
      }
      onComplete();
    } catch (err: any) {
      setAuthError(err.message || 'Diçka shkoi keq. Ju lutemi provoni përsëri.');
    } finally {
      setAuthLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Progress bar – only for steps 1-3 */}
        {step <= 3 && (
          <div className="flex flex-col gap-2">
            <ProgressBar step={step} />
            <p className="text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
              Hapi {step} nga 3
            </p>
          </div>
        )}

        {/* ── Step 1: Motivation ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            <div>
              <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                Pse dëshiron të mësosh Gjermanisht?
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Zgjidhni motivimin tuaj kryesor.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {motivationOptions.map(opt => {
                const selected = data.motivation === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setData(d => ({ ...d, motivation: opt.id }))}
                    className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 active:scale-95 min-h-[120px] cursor-pointer"
                    style={{
                      borderColor: selected ? PEAR : 'var(--border-color)',
                      backgroundColor: selected ? `${PEAR}18` : 'var(--card-bg, var(--bg-color-secondary))',
                      boxShadow: selected ? `0 0 0 3px ${PEAR_GLOW}` : undefined,
                    }}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-sm font-semibold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <NavButtons step={step} canAdvance={canAdvance()} onNext={handleNext} onBack={handleBack} />
          </div>
        )}

        {/* ── Step 2: Level ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            <div>
              <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                Sa është njohuria jote aktuale?
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Zgjidhni nivelin që ju përshkruan.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {levelOptions.map(opt => {
                const selected = data.level === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setData(d => ({ ...d, level: opt.id }))}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    style={{
                      borderColor: selected ? PEAR : 'var(--border-color)',
                      backgroundColor: selected ? `${PEAR}18` : 'var(--card-bg, var(--bg-color-secondary))',
                      boxShadow: selected ? `0 0 0 3px ${PEAR_GLOW}` : undefined,
                    }}
                  >
                    {/* Radio dot */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200"
                      style={{ borderColor: selected ? PEAR : 'var(--border-color)' }}
                    >
                      {selected && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PEAR }} />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <NavButtons step={step} canAdvance={canAdvance()} onNext={handleNext} onBack={handleBack} />
          </div>
        )}

        {/* ── Step 3: Daily Commitment ──────────────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            <div>
              <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                Sa minuta në ditë mund të mësosh?
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Zgjidhni angazhimin tuaj ditor.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {commitmentOptions.map(opt => {
                const selected = data.commitment === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setData(d => ({ ...d, commitment: opt.id }))}
                    className="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    style={{
                      borderColor: selected ? PEAR : 'var(--border-color)',
                      backgroundColor: selected ? `${PEAR}18` : 'var(--card-bg, var(--bg-color-secondary))',
                      boxShadow: selected ? `0 0 0 3px ${PEAR_GLOW}` : undefined,
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: selected ? PEAR : 'var(--border-color)',
                            color: selected ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{ borderColor: selected ? PEAR : 'var(--border-color)', backgroundColor: selected ? PEAR : 'transparent' }}
                    >
                      {selected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <NavButtons step={step} canAdvance={canAdvance()} onNext={handleNext} onBack={handleBack} />
          </div>
        )}

        {/* ── Step 4: AI Loading ────────────────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center gap-10 py-16 animate-[fadeIn_0.4s_ease-out]">
            {/* Pulsing orb */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute rounded-full animate-ping opacity-30"
                style={{ width: 120, height: 120, backgroundColor: PEAR }}
              />
              <div
                className="absolute rounded-full animate-ping opacity-20"
                style={{ width: 160, height: 160, backgroundColor: PEAR, animationDelay: '0.3s' }}
              />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl"
                style={{ backgroundColor: PEAR, boxShadow: `0 0 40px ${PEAR_GLOW}` }}
              >
                🍐
              </div>
            </div>

            {/* Animated text */}
            <div className="flex flex-col items-center gap-2 text-center min-h-[60px]">
              <p
                key={loadingTextIdx}
                className="text-lg font-semibold animate-[fadeIn_0.4s_ease-out]"
                style={{ color: 'var(--text-primary)' }}
              >
                {aiLoadingTexts[loadingTextIdx]}
              </p>
              <div className="flex gap-1.5 mt-2">
                {aiLoadingTexts.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i === loadingTextIdx ? PEAR : 'var(--border-color)', transform: i === loadingTextIdx ? 'scale(1.4)' : 'scale(1)' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: CTA / Sign Up ────────────────────────────────────── */}
        {step === 5 && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 pt-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
                style={{ backgroundColor: PEAR, boxShadow: `0 8px 32px ${PEAR_GLOW}` }}
              >
                🍐
              </div>
              <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                Plani yt personal është gati!
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Krijo llogarinë falas për të ruajtur progresin dhe për të filluar mësimin.
              </p>
            </div>

            {/* Error */}
            {authError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm"
                style={{ backgroundColor: 'rgba(218,54,51,0.1)', borderColor: 'rgba(218,54,51,0.3)', color: 'var(--danger-color)' }}>
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Email sent confirmation */}
            {emailSent ? (
              <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-2xl border text-center"
                style={{ backgroundColor: `${PEAR}15`, borderColor: PEAR }}>
                <span className="text-3xl">📬</span>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Kontrolloni emailin tuaj!</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Ju dërguam një lidhje hyrjeje në <strong>{emailInput}</strong>. Klikoni atë për t'u identifikuar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                {/* Google */}
                <AuthButton
                  onClick={() => authAction('google')}
                  loading={authLoading === 'google'}
                  disabled={!!authLoading}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  }
                  label="Vazhdo me Google"
                  style={{ backgroundColor: 'var(--bg-color-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />

                {/* Apple */}
                <AuthButton
                  onClick={() => authAction('apple')}
                  loading={authLoading === 'apple'}
                  disabled={!!authLoading}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.125 1c.07 1.344-.378 2.647-1.125 3.594-.744.947-1.918 1.687-3.094 1.594-.094-1.313.416-2.641 1.125-3.532C13.782 1.688 15.016.938 16.125 1zm3.844 19.219c-.656.938-1.36 1.876-2.469 1.876s-1.594-.657-2.906-.688c-1.282-.031-1.75.672-2.844.688-1.094.031-2.157-1.063-2.813-2.001C6.25 17.032 5.625 13.657 6.938 11.25c.875-1.594 2.469-2.594 4.125-2.625 1.219-.032 2.344.75 3.094.75.75 0 2.125-.938 3.594-.782 1.125.063 2.188.531 2.969 1.407-2.016 1.219-2.563 3.844-1.094 5.938.75 1.063 1.969 1.75 2.969 1.75-.344.876-.75 1.688-1.625 2.531z" />
                    </svg>
                  }
                  label="Vazhdo me Apple"
                  style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none' }}
                />

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>OSE</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                </div>

                {/* Email input + button */}
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && authAction('email')}
                    placeholder="adresa@email.com"
                    className="w-full px-4 py-3.5 rounded-xl border text-base outline-none transition-all duration-200 focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <AuthButton
                    onClick={() => authAction('email')}
                    loading={authLoading === 'email'}
                    disabled={!!authLoading || !emailInput.trim()}
                    icon={<span>✉️</span>}
                    label="Regjistrohu me Email"
                    style={{ backgroundColor: PEAR, color: '#fff', border: 'none', boxShadow: `0 4px 16px ${PEAR_GLOW}` }}
                  />
                </div>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Duke vazhduar, ju pranoni{' '}
              <span className="underline cursor-pointer" style={{ color: PEAR }}>Kushtet e Shërbimit</span>
              {' '}dhe{' '}
              <span className="underline cursor-pointer" style={{ color: PEAR }}>Politikën e Privatësisë</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI Atoms ──────────────────────────────────────────────────────────

function NavButtons({
  step, canAdvance, onNext, onBack,
}: { step: number; canAdvance: boolean; onNext: () => void; onBack: () => void }) {
  const PEAR = '#84a98c';
  return (
    <div className="flex gap-3 mt-2">
      {step > 1 && (
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl font-semibold border transition-all duration-200 active:scale-95 cursor-pointer"
          style={{ backgroundColor: 'var(--bg-color-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Kthehu
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        className="flex-[2] py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{
          backgroundColor: canAdvance ? PEAR : 'var(--border-color)',
          color: canAdvance ? '#fff' : 'var(--text-secondary)',
          boxShadow: canAdvance ? `0 4px 16px rgba(132,169,140,0.35)` : undefined,
        }}
      >
        Vazhdo
      </button>
    </div>
  );
}

function AuthButton({
  onClick, loading, disabled, icon, label, style,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      style={style}
    >
      {loading ? (
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 60" />
        </svg>
      ) : icon}
      {label}
    </button>
  );
}
