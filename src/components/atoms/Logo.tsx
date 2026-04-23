import { useTheme } from '@/hooks/useTheme';
import logoBlack from '@/assets/logos/logo_en.png';
import logoAr from '@/assets/logos/logo_ar.png';
import { useTranslation } from '@/hooks/useTranslation';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const { isDark } = useTheme();
  const { language } = useTranslation();

  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  // Determine which logo to use based on language
  const logoSrc = language === 'ar' ? logoAr : logoBlack;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt="QuickMart Logo"
        className={`${sizes[size]} w-auto object-contain transition-all duration-300 ${
          isDark ? 'invert brightness-200' : ''
        }`}
      />
    </div>
  );
}
