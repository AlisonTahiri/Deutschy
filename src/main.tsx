import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { App as KonstaProvider } from 'konsta/react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import './index.css';

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
      <KonstaAppWrapper />
    </SettingsProvider>
  </StrictMode>,
);
