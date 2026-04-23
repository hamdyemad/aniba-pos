import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { useOnlineStatus } from '@/hooks/useHardware';
import { syncService } from '@/services/posService';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useRegion } from '@/hooks/useRegion';
import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  History,
  Lock,
  ListOrdered,
  Languages,
  Sun,
  Moon,
  Globe,
  Maximize,
  Minimize,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '@/components/atoms/Logo';
import { usePOS } from '@/hooks/usePOS';
import { User } from 'lucide-react';


interface HeaderProps {
  onOpenHistory: () => void;
  onOpenSessionClose: () => void;
  onOpenBalancesHistory: () => void;
  onOpenCurrentSession: () => void;
}

export function Header({ onOpenHistory, onOpenSessionClose, onOpenBalancesHistory, onOpenCurrentSession }: HeaderProps) {
  const { state } = usePOS();
  const isOnline = useOnlineStatus();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { countries, selectedCountry, setSelectedCountry, isLoading: isRegionLoading } = useRegion();
  const { isDark, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncCount, setSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadSyncCount = async () => {
      const count = await syncService.getSyncCount();
      setSyncCount(count);
    };
    loadSyncCount();
    const interval = setInterval(loadSyncCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.processSyncQueue();
      const count = await syncService.getSyncCount();
      setSyncCount(count);
      toast.success(t('header.syncSuccess', { success: result.success, failed: result.failed }));
    } catch {
      toast.error(t('header.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    // Reload the page to ensure all data is re-fetched with correct language
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const timeStr = currentTime.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 w-full ${isScrolled ? 'py-2 px-2 sm:px-4' : 'py-0 px-0'}`}>
      <div 
        className={`w-full transition-all duration-500 mx-auto backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 shrink-0 bg-[var(--bg-secondary)]/80 border-[var(--border-color)] ${
          isScrolled 
            ? 'h-14 max-w-7xl rounded-2xl shadow-2xl border' 
            : 'h-16 max-w-none rounded-none border-b'
        }`}
      >

        {/* Left - Logo & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Logo size="md" />
          <div className="hidden xs:block border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
            <p className="text-[8px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-widest opacity-80">{t('header.terminal')}</p>
          </div>
          
          <button 
            onClick={onOpenCurrentSession}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group
              ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {state.currentUser?.name}
            </span>
          </button>
        </div>

        {/* Center - Time */}
        <div className="hidden lg:flex items-center gap-6">
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border bg-[var(--bg-overlay)] border-[var(--border-color)]`}>
            <div className="flex items-center gap-2 text-indigo-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-black font-mono">{timeStr}</span>
            </div>
            <div className={`w-px h-3 bg-[var(--border-color)]`} />
            <span className={`text-[11px] font-bold uppercase tracking-tight text-[var(--text-secondary)]`}>{dateStr}</span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Language */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
          >
            <Languages className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-black uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Country Selector */}
          <div className="relative group/country">
            <button
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
              disabled={isRegionLoading}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-black uppercase">
                {selectedCountry?.code || '...'}
              </span>
            </button>
            
            {countries.length > 1 && (
              <div className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/country:opacity-100 group-hover/country:visible transition-all z-50`}>
                <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-overlay)]">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)] px-2">{t('header.selectCountry') || 'Select Country'}</p>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => {
                        setSelectedCountry(country);
                        // Optional: Reload to fetch localized data
                        window.location.reload();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-all ${
                        selectedCountry?.id === country.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{country.code === 'eg' ? '🇪🇬' : country.code === 'sa' ? '🇸🇦' : '🌍'}</span>
                        <span className="text-xs font-bold">{country.name}</span>
                      </div>
                      {selectedCountry?.id === country.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sync */}
          {syncCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="group flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="text-[10px] sm:text-xs font-black">{syncCount}</span>
            </button>
          )}

          {/* Status */}
          <div className={`flex items-center p-1 rounded-xl border bg-[var(--bg-overlay)] border-[var(--border-color)]`}>
            <Badge
              variant={isOnline ? 'success' : 'warning'}
              size="sm"
              className="px-1.5 sm:px-2 py-0.5 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-tighter"
            >
              {isOnline ? (
                <><Wifi className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('header.connected')}</>
              ) : (
                <><WifiOff className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('header.offline')}</>
              )}
            </Badge>
          </div>

          <div className={`w-px h-6 hidden sm:block mx-0.5 bg-[var(--border-color)]`} />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onOpenHistory}
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl gap-2 transition-all hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
              title={t('header.orderHistory')}>
              <History className="w-4 h-4" />
              <span className="hidden xl:inline font-bold text-xs">{t('header.orderHistory')}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={onOpenBalancesHistory}
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl gap-2 transition-all hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
              title={t('header.sessionHistory')}>
              <ListOrdered className="w-4 h-4" />
              <span className="hidden xl:inline font-bold text-xs">{t('header.sessionHistory')}</span>
            </Button>

            <Button variant="danger" size="sm" onClick={onOpenSessionClose}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl gap-2 shadow-lg shadow-red-500/10 active:scale-95 transition-all"
              title={t('header.closeSession')}>
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline font-bold text-xs">{t('header.closeSession')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}