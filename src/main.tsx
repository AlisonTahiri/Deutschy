import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { App as KonstaProvider } from 'konsta/react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider } from './hooks/useAuth';
import './index.css';
import './i18n/config';

function KonstaAppWrapper() {
  const { settings, isLoading } = useSettings();

  if (isLoading) return null;

  return (
    <KonstaProvider theme={settings.konstaTheme} dark={settings.theme === 'dark'}>
      <App />
    </KonstaProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <KonstaAppWrapper />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>,
);
