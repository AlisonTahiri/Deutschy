import { useState, useEffect } from 'react';
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

export type ViewState = 'home' | 'settings' | 'exercise' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
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

  const handleStartExercise = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentView('exercise');
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setActiveLessonId(null);
  };

  if (!isDbReady || authLoading) {
    return (
      <div className="flex-column align-center justify-center gap-md" style={{ height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2>Initializing...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please wait a moment.</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
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
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      <BackgroundMCQGenerator />
      {currentView === 'home' && (
        role === 'member' && !activeLevelId && !isChecking ? (
          <Paywall onPurchaseSuccess={checkSubscription} />
        ) : (
          <Home onStartExercise={handleStartExercise} />
        )
      )}
      {currentView === 'settings' && <Settings />}
      {currentView === 'admin' && <Admin />}
      {currentView === 'exercise' && activeLessonId && (
        <ExerciseContainer
          lessonId={activeLessonId}
          onExit={() => handleNavigate('home')}
        />
      )}
    </Layout>
  );
}

export default App;
