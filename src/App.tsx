import { useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Settings } from './components/Settings';
import { ExerciseContainer } from './components/ExerciseContainer';

export type ViewState = 'home' | 'settings' | 'exercise';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const handleStartExercise = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentView('exercise');
  };

  const handleNavigate = (view: 'home' | 'settings') => {
    setCurrentView(view);
    setActiveLessonId(null);
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'home' && <Home onStartExercise={handleStartExercise} />}
      {currentView === 'settings' && <Settings />}
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
