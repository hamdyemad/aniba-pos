import { POSProvider } from '@/hooks/usePOS';
import { POSPage } from '@/pages/POSPage';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/hooks/useTranslation';
import { ThemeProvider } from '@/hooks/useTheme';
import { RegionProvider } from '@/hooks/useRegion';

import { usePOS } from '@/hooks/usePOS';
import { LoginPage } from '@/pages/LoginPage';
import { SessionOpenPage } from '@/pages/SessionOpenPage';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function AppContent() {
  const { state } = usePOS();
  const { t } = useTranslation();

  if (state.isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">{t('common.checkingSession')}</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return <LoginPage />;
  }

  if (!state.currentSession) {
    return <SessionOpenPage />;
  }

  return <POSPage />;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RegionProvider>
          <POSProvider>
            <AppContent />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
                },
                success: {
                  iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
                },
              }}
            />
          </POSProvider>
        </RegionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;