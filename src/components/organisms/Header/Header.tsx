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
  Menu,
  X,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <>
      <header className={`sticky top-0 z-50 transition-all duration-500 w-full ${isScrolled ? 'py-2 px-2 sm:px-4' : 'py-0 px-0'}`}>
        <div 
          className={`w-full transition-all duration-500 mx-auto backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 shrink-0 bg-[var(--bg-secondary)]/80 border-[var(--border-color)] ${
            isScrolled 
              ? 'h-14 max-w-7xl rounded-2xl shadow-2xl border' 
              : 'h-16 max-w-none rounded-none border-b'
          }`}
        >
          {/* Mobile Header - Logo & Critical Actions */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Logo size="lg" className="scale-110" />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="danger" size="icon" onClick={onOpenSessionClose}
                className="h-10 w-10 rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition-all">
                <Lock className="w-5 h-5" />
              </Button>
              
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Desktop Header - Left: Logo & User */}
          <div className="hidden md:flex items-center gap-4">
            <Logo size="md" />
            <div className="hidden lg:block border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest opacity-80">{t('header.terminal')}</p>
            </div>
            
            <button 
              onClick={onOpenCurrentSession}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group
                ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'} truncate max-w-[120px]`}>
                {state.currentUser?.name}
              </span>
            </button>
          </div>

          {/* Desktop Header - Center: Time */}
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

          {/* Desktop Header - Right: Actions */}
          <div className="hidden md:flex items-center gap-2">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs font-black uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Country Selector */}
            <div className="relative group/country">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border cursor-pointer bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]`}
                disabled={isRegionLoading}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-black uppercase">
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
                className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="text-xs font-black">{syncCount}</span>
              </button>
            )}

            {/* Status */}
            <div className={`flex items-center p-1 rounded-xl border bg-[var(--bg-overlay)] border-[var(--border-color)]`}>
              <Badge
                variant={isOnline ? 'success' : 'warning'}
                size="sm"
                className="px-2 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-tighter"
              >
                {isOnline ? (
                  <><Wifi className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('header.connected')}</>
                ) : (
                  <><WifiOff className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('header.offline')}</>
                )}
              </Badge>
            </div>

            <div className={`w-px h-6 mx-0.5 bg-[var(--border-color)]`} />

            {/* Histories */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onOpenHistory}
                className={`h-9 px-3 rounded-xl gap-2 transition-all hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
                title={t('header.orderHistory')}>
                <History className="w-4 h-4" />
                <span className="hidden xl:inline font-bold text-xs">{t('header.orderHistory')}</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={onOpenBalancesHistory}
                className={`h-9 px-3 rounded-xl gap-2 transition-all hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
                title={t('header.sessionHistory')}>
                <ListOrdered className="w-4 h-4" />
                <span className="hidden xl:inline font-bold text-xs">{t('header.sessionHistory')}</span>
              </Button>

              <Button variant="danger" size="sm" onClick={onOpenSessionClose}
                className="h-9 px-4 rounded-xl gap-2 shadow-lg shadow-red-500/10 active:scale-95 transition-all"
                title={t('header.closeSession')}>
                <Lock className="w-4 h-4" />
                <span className="hidden md:inline font-bold text-xs">{t('header.closeSession')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Utility Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-[60] transition-all duration-300 ${isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onMouseDown={() => setIsDrawerOpen(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <aside 
          className={`absolute top-0 bottom-0 w-80 bg-[var(--bg-secondary)] shadow-2xl transition-transform duration-300 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar ${isRTL ? (isDrawerOpen ? 'right-0' : '-right-full') : (isDrawerOpen ? 'left-0' : '-left-full')}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                <User className="w-5 h-5" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('header.terminal')}</p>
                <p className="font-bold text-[var(--text-primary)]">{state.currentUser?.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)} className="rounded-xl">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <div className={`p-4 rounded-[2rem] border bg-[var(--bg-overlay)] border-[var(--border-color)]`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black uppercase text-[var(--text-muted)]">{t('header.status') || 'Status'}</p>
                <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
                  {isOnline ? t('header.connected') : t('header.offline')}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-indigo-400">
                <p className="text-xs font-black uppercase">{t('header.time') || 'Time'}</p>
                <p className="text-sm font-black font-mono">{timeStr}</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="space-y-1">
              <p className="px-4 text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 tracking-widest">{t('header.settings') || 'Settings'}</p>
              
              <button onClick={toggleTheme} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <span className="font-bold text-[var(--text-primary)]">{isDark ? t('header.lightMode') || 'Light Mode' : t('header.darkMode') || 'Dark Mode'}</span>
              </button>

              <button onClick={toggleLanguage} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                  <Languages className="w-5 h-5" />
                </div>
                <span className="font-bold text-[var(--text-primary)]">{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button onClick={() => { onOpenCurrentSession(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group border border-indigo-500/10 bg-indigo-500/5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-bold text-indigo-500">{t('currentSession.title')}</span>
              </button>

              {countries.length > 1 && (
                <div className="px-4 py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">{t('header.country') || 'Country'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {countries.map((country) => (
                      <button
                        key={country.id}
                        onClick={() => {
                          setSelectedCountry(country);
                          window.location.reload();
                        }}
                        className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedCountry?.id === country.id ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                        }`}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            <nav className="space-y-1">
              <p className="px-4 text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 tracking-widest">{t('header.history') || 'History'}</p>
              
              <button onClick={() => { onOpenHistory(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group">
                <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <span className="font-bold text-[var(--text-primary)]">{t('header.orderHistory')}</span>
              </button>

              <button onClick={() => { onOpenBalancesHistory(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group">
                <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <span className="font-bold text-[var(--text-primary)]">{t('header.sessionHistory')}</span>
              </button>
            </nav>

            {syncCount > 0 && (
              <Button variant="primary" className="w-full h-14 rounded-2xl gap-3" onClick={handleSync} disabled={isSyncing}>
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                {t('header.syncCount', { count: syncCount }) || `Sync ${syncCount} items`}
              </Button>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
            <Button variant="danger" className="w-full h-14 rounded-2xl gap-3 shadow-xl shadow-red-500/20" onClick={() => { onOpenSessionClose(); setIsDrawerOpen(false); }}>
              <Lock className="w-5 h-5" />
              {t('header.closeSession')}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}