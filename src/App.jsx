import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AuthModal from './components/modals/AuthModal';

const THEMES = {
  ocean: {
    name: 'Ocean (Default)',
    primary: '#00ADB5', primaryContent: '#FFFFFF', success: '#00ADB5', danger: '#F43F5E', warning: '#F59E0B', accent: '#8B5CF6',
    light: { bgMain: '#F8FAFC', bgSurface: '#FFFFFF', textMain: '#0F172A', textMuted: '#475569', borderMain: 'rgba(15, 23, 42, 0.08)', bgHover: '#F1F5F9' },
    dark: { bgMain: '#1E293B', bgSurface: '#334155', textMain: '#F8FAFC', textMuted: '#94A3B8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#475569' }
  },
  deepBlue: {
    name: 'Deep Blue',
    primary: '#3282B8', primaryContent: '#FFFFFF', success: '#3282B8', danger: '#E62727', warning: '#FF9F00', accent: '#0F4C75',
    light: { bgMain: '#F0F4F8', bgSurface: '#FFFFFF', textMain: '#102A43', textMuted: '#334E68', borderMain: 'rgba(16, 42, 67, 0.1)', bgHover: '#D9E2EC' },
    dark: { bgMain: '#102A43', bgSurface: '#243B53', textMain: '#F0F4F8', textMuted: '#9FB3C8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#334E68' }
  },
  retro: {
    name: 'Retro Classic',
    primary: '#E62727', primaryContent: '#FFFFFF', success: '#1E93AB', danger: '#E62727', warning: '#F4631E', accent: '#1E93AB',
    light: { bgMain: '#F4F1EA', bgSurface: '#FFFFFF', textMain: '#2A2A2A', textMuted: '#595959', borderMain: 'rgba(42, 42, 42, 0.1)', bgHover: '#EAE6DB' },
    dark: { bgMain: '#2D2A26', bgSurface: '#3D3935', textMain: '#F4F1EA', textMuted: '#AFA9A0', borderMain: 'rgba(244, 241, 234, 0.1)', bgHover: '#4D4843' }
  },
  neonPurple: {
    name: 'Neon Cyber',
    primary: '#B13BFF', primaryContent: '#FFFFFF', success: '#1DCD9F', danger: '#F43F5E', warning: '#FFCC00', accent: '#FFCC00',
    light: { bgMain: '#F5F3FF', bgSurface: '#FFFFFF', textMain: '#1E1B4B', textMuted: '#4C1D95', borderMain: 'rgba(30, 27, 75, 0.1)', bgHover: '#EDE9FE' },
    dark: { bgMain: '#1E1B4B', bgSurface: '#2E1065', textMain: '#F5F3FF', textMuted: '#C4B5FD', borderMain: 'rgba(245, 243, 255, 0.1)', bgHover: '#4C1D95' }
  },
  solaris: {
    name: 'Solaris Gold',
    primary: '#D4AF37', primaryContent: '#000000', success: '#10B981', danger: '#EF4444', warning: '#F59E0B', accent: '#92400E',
    light: { bgMain: '#FFFBEB', bgSurface: '#FFFFFF', textMain: '#451A03', textMuted: '#92400E', borderMain: 'rgba(146, 64, 14, 0.1)', bgHover: '#FEF3C7' },
    dark: { bgMain: '#1A1A1A', bgSurface: '#262626', textMain: '#FDE68A', textMuted: '#D4AF37', borderMain: 'rgba(212, 175, 55, 0.1)', bgHover: '#404040' }
  },
  forest: {
    name: 'Deep Forest',
    primary: '#10B981', primaryContent: '#FFFFFF', success: '#34D399', danger: '#E11D48', warning: '#FBBF24', accent: '#064E3B',
    light: { bgMain: '#F0FDF4', bgSurface: '#FFFFFF', textMain: '#064E3B', textMuted: '#15803D', borderMain: 'rgba(6, 78, 59, 0.1)', bgHover: '#DCFCE7' },
    dark: { bgMain: '#064E3B', bgSurface: '#065F46', textMain: '#ECFDF5', textMuted: '#A7F3D0', borderMain: 'rgba(255, 255, 255, 0.05)', bgHover: '#064E3B' }
  },
  glacier: {
    name: 'Arctic Glacier',
    primary: '#06B6D4', primaryContent: '#FFFFFF', success: '#22D3EE', danger: '#F43F5E', warning: '#F59E0B', accent: '#083344',
    light: { bgMain: '#F0FDFF', bgSurface: '#FFFFFF', textMain: '#083344', textMuted: '#0E7490', borderMain: 'rgba(8, 51, 68, 0.1)', bgHover: '#CFFAFE' },
    dark: { bgMain: '#082F49', bgSurface: '#0C4A6E', textMain: '#E0F2FE', textMuted: '#7DD3FC', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#075985' }
  },
  volcano: {
    name: 'Volcanic Ash',
    primary: '#EF4444', primaryContent: '#FFFFFF', success: '#DC2626', danger: '#B91C1C', warning: '#F97316', accent: '#450A0A',
    light: { bgMain: '#FEF2F2', bgSurface: '#FFFFFF', textMain: '#450A0A', textMuted: '#991B1B', borderMain: 'rgba(69, 10, 10, 0.1)', bgHover: '#FEE2E2' },
    dark: { bgMain: '#450A0A', bgSurface: '#7F1D1D', textMain: '#FEE2E2', textMuted: '#FCA5A5', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#991B1B' }
  },
  monochrome: {
    name: 'Slate Minimal',
    primary: '#64748B', primaryContent: '#FFFFFF', success: '#94A3B8', danger: '#475569', warning: '#CBD5E1', accent: '#1E293B',
    light: { bgMain: '#F8FAFC', bgSurface: '#FFFFFF', textMain: '#0F172A', textMuted: '#475569', borderMain: 'rgba(15, 23, 42, 0.1)', bgHover: '#F1F5F9' },
    dark: { bgMain: '#0F172A', bgSurface: '#1E293B', textMain: '#F8FAFC', textMuted: '#94A3B8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#334155' }
  },
  midnight: {
    name: 'Midnight Stealth',
    primary: '#38BDF8', primaryContent: '#FFFFFF', success: '#0EA5E9', danger: '#0369A1', warning: '#0284C7', accent: '#000000',
    light: { bgMain: '#F0F9FF', bgSurface: '#FFFFFF', textMain: '#082F49', textMuted: '#075985', borderMain: 'rgba(8, 47, 73, 0.1)', bgHover: '#E0F2FE' },
    dark: { bgMain: '#000000', bgSurface: '#111111', textMain: '#FFFFFF', textMuted: '#A1A1AA', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#18181B' }
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTheme, setActiveTheme] = useState('ocean');

  useEffect(() => {
    import('./lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });

      // Handle email confirmation routing
      const hash = window.location.hash;
      if (hash && hash.includes('type=signup')) {
         showAppToast('Email successfully verified! Welcome aboard.', 'success');
         window.history.replaceState(null, '', window.location.pathname);
      } else if (hash && hash.includes('type=recovery')) {
         showAppToast('Password recovery mode active. Please update your settings.', 'info');
         window.history.replaceState(null, '', window.location.pathname);
      }

      return () => subscription.unsubscribe();
    });
  }, []);

  const themeData = THEMES[activeTheme];
  const modeData = isDarkMode ? themeData.dark : themeData.light;

  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  }, []);

  const buildColorVars = useCallback((name, hex) => {
    const rgb = hexToRgb(hex);
    return {
      [`--${name}`]: hex,
      [`--${name}-10`]: `rgba(${rgb}, 0.1)`,
      [`--${name}-20`]: `rgba(${rgb}, 0.2)`,
      [`--${name}-30`]: `rgba(${rgb}, 0.3)`,
      [`--${name}-50`]: `rgba(${rgb}, 0.5)`,
    };
  }, [hexToRgb]);

  const customStyles = useMemo(() => ({
    '--bg-main': modeData.bgMain,
    '--bg-surface': modeData.bgSurface,
    '--text-main': modeData.textMain,
    '--text-muted': modeData.textMuted,
    '--border-main': modeData.borderMain,
    '--bg-hover': modeData.bgHover,
    '--primary-content': themeData.primaryContent,
    ...buildColorVars('primary', themeData.primary),
    ...buildColorVars('success', themeData.success),
    ...buildColorVars('danger', themeData.danger),
    ...buildColorVars('warning', themeData.warning),
    ...buildColorVars('accent', themeData.accent),
  }), [modeData, themeData, buildColorVars]);

  const [appToasts, setAppToasts] = useState([]);
  const showAppToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAppToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setAppToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <div className={isDarkMode ? 'dark' : ''} style={customStyles}>
      <Dashboard 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={async () => {
          const { supabase } = await import('./lib/supabase');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        }}
        isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} 
        activeTheme={activeTheme} setActiveTheme={setActiveTheme} themes={THEMES}
      />
      {showAuthModal && (
        <AuthModal 
          onLogin={() => { setIsAuthenticated(true); setShowAuthModal(false); }} 
          onClose={() => setShowAuthModal(false)} 
          showToast={showAppToast}
        />
      )}
      {/* App-level toasts (for AuthModal) */}
      <div className="fixed bottom-6 left-6 z-[400] flex flex-col gap-3 pointer-events-none">
        {appToasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-left-8 duration-300" style={{
            backgroundColor: toast.type === 'error' ? '#F43F5E' : toast.type === 'success' ? '#10B981' : '#3B82F6',
            color: '#FFFFFF'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
