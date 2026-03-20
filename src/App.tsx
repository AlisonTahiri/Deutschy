import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Settings } from './components/Settings';
import { ExerciseContainer } from './components/ExerciseContainer';
import { BackgroundMCQGenerator } from './components/BackgroundMCQGenerator';
import { dbService } from './services/db/provider';
import { useAuth } from './hooks/useAuth';
import { Auth } from './components/Auth';
import { SocialLoginService } from './services/auth/SocialLoginService';
import { Admin } from './components/Admin';
import { useSubscription } from './hooks/useSubscription';
import { Paywall } from './components/Paywall';
import { Onboarding } from './components/Onboarding';

function App() {
  const { t } = useTranslation();
  const [isDbReady, setIsDbReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() =>
    localStorage.getItem('dardha_onboarding_done') === 'true'
  );
  const { session, role, isLoading: authLoading } = useAuth();

  // Initialize revenuecat and sync subscription
  const { isChecking, activeLevelId, checkSubscription } = useSubscription();

  useEffect(() => {
    const initApp = async () => {
      try {
        await SocialLoginService.initialize();
        await dbService.init();
        setIsDbReady(true);
      } catch (err) {
        console.error("Critical: Failed to initialize app", err);
      }
    };
    initApp();
  }, []);

  // Auto-complete onboarding if session exists
  useEffect(() => {
    if (session && !onboardingDone) {
      localStorage.setItem('dardha_onboarding_done', 'true');
      setOnboardingDone(true);
    }
  }, [session, onboardingDone]);

  if (!isDbReady || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-color)] rounded-full animate-spin"></div>
        <h2 className="m-0 text-xl font-semibold">{t('app.initializing')}</h2>
        <p className="m-0 text-[var(--text-secondary)]">{t('app.waitMoment')}</p>
      </div>
    );
  }

  if (!session) {
    if (!onboardingDone) {
      return (
        <Onboarding
          onComplete={() => {
            localStorage.setItem('dardha_onboarding_done', 'true');
            setOnboardingDone(true);
          }}
        />
      );
    }
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <BackgroundMCQGenerator />
        <Routes>
          <Route
            path="/"
            element={
              role === 'member' && !activeLevelId && !isChecking ? (
                <Paywall onPurchaseSuccess={checkSubscription} />
              ) : (
                <Home />
              )
            }
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/exercise/:lessonId" element={<ExerciseContainer />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
