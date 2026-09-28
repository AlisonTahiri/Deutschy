import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { ExerciseContainer } from "./components/ExerciseContainer";
import { dbService } from "./services/db/provider";
import { dbV2 } from "./services/db/DexieServiceV2";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";
import { SocialLoginService } from "./services/auth/SocialLoginService";
import { Games } from "./components/Games";
import { VocabularyProviderV2 } from "./context/VocabularyContextV2";

const Admin = lazy(() =>
  import("./components/Admin").then((m) => ({ default: m.Admin }))
);

const ConversationsList = lazy(() =>
  import("./components/conversations/ConversationsList").then((m) => ({ default: m.ConversationsList }))
);

import { Onboarding } from "./components/Onboarding";
import { useSyncManagerV2 } from "./hooks/useSyncManagerV2";
import { StorageKeys } from "./utils/storage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const { t } = useTranslation();
  const [isDbReady, setIsDbReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(StorageKeys.onboardingDone) === "true",
  );
  const { session, isLoading: authLoading } = useAuth();

  // Initialize V2 sync manager (version check + progress sync only)
  useSyncManagerV2(() => {
    // Fired when levels change — notify VocabularyContextV2 to refresh
    window.dispatchEvent(new CustomEvent('local-db-updated'));
  });



  useEffect(() => {
    const initApp = async () => {
      try {
        await SocialLoginService.initialize();
        await dbService.init();
        await dbV2.init(); // Initialize new V2 DB
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
      localStorage.setItem(StorageKeys.onboardingDone, "true");
      setOnboardingDone(true);
    }
  }, [session, onboardingDone]);

  if (!isDbReady || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-color)] rounded-full animate-spin"></div>
        <h2 className="m-0 text-xl font-semibold">{t("app.initializing")}</h2>
        <p className="m-0 text-[var(--text-secondary)]">
          {t("app.waitMoment")}
        </p>
      </div>
    );
  }

  if (!session) {
    if (!onboardingDone) {
      return (
        <Onboarding
          onComplete={() => {
            localStorage.setItem(StorageKeys.onboardingDone, "true");
            setOnboardingDone(true);
          }}
        />
      );
    }
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <VocabularyProviderV2>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
              <Route path="/games" element={<Games />} />
              <Route path="/conversations" element={<Suspense fallback={null}><ConversationsList /></Suspense>} />
              <Route path="/exercise/:lessonId" element={<ExerciseContainer />} />
              {/* Fallback to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </VocabularyProviderV2>
    </BrowserRouter>
  );
}

export default App;
