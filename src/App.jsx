import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AuthModal from './components/modals/AuthModal';
import { io } from 'socket.io-client';
import { Analytics } from "@vercel/analytics/react";

const THEMES = {
  ocean: {
    name: 'Ocean (Default)',
    primary: '#00F0FF', primaryContent: '#000000', success: '#00FA9A', danger: '#FF0055', warning: '#FFB800', accent: '#7000FF',
    light: { bgMain: '#F8FAFC', bgSurface: '#FFFFFF', textMain: '#0F172A', textMuted: '#475569', borderMain: 'rgba(15, 23, 42, 0.08)', bgHover: '#F1F5F9' },
    dark: { bgMain: '#0B1120', bgSurface: '#1E293B', textMain: '#F8FAFC', textMuted: '#94A3B8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#334155' }
  },
  deepBlue: {
    name: 'Electric Blue',
    primary: '#1E90FF', primaryContent: '#FFFFFF', success: '#00FFFF', danger: '#FF3366', warning: '#FFCC00', accent: '#8A2BE2',
    light: { bgMain: '#F0F4F8', bgSurface: '#FFFFFF', textMain: '#102A43', textMuted: '#334E68', borderMain: 'rgba(16, 42, 67, 0.1)', bgHover: '#D9E2EC' },
    dark: { bgMain: '#081421', bgSurface: '#102A43', textMain: '#F0F4F8', textMuted: '#9FB3C8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#243B53' }
  },
  retro: {
    name: 'Retro Arcade',
    primary: '#FF0055', primaryContent: '#FFFFFF', success: '#00FFCC', danger: '#FF0055', warning: '#FF8800', accent: '#00FFCC',
    light: { bgMain: '#F4F1EA', bgSurface: '#FFFFFF', textMain: '#2A2A2A', textMuted: '#595959', borderMain: 'rgba(42, 42, 42, 0.1)', bgHover: '#EAE6DB' },
    dark: { bgMain: '#1A1815', bgSurface: '#2D2A26', textMain: '#F4F1EA', textMuted: '#AFA9A0', borderMain: 'rgba(244, 241, 234, 0.1)', bgHover: '#3D3935' }
  },
  neonPurple: {
    name: 'Neon Cyber',
    primary: '#FF00FF', primaryContent: '#FFFFFF', success: '#00FFFF', danger: '#FF3333', warning: '#FFFF00', accent: '#00FFFF',
    light: { bgMain: '#F5F3FF', bgSurface: '#FFFFFF', textMain: '#1E1B4B', textMuted: '#4C1D95', borderMain: 'rgba(30, 27, 75, 0.1)', bgHover: '#EDE9FE' },
    dark: { bgMain: '#0F0826', bgSurface: '#1E1B4B', textMain: '#F5F3FF', textMuted: '#C4B5FD', borderMain: 'rgba(245, 243, 255, 0.1)', bgHover: '#2E1065' }
  },
  solaris: {
    name: 'Solaris Gold',
    primary: '#FFD700', primaryContent: '#000000', success: '#00FF00', danger: '#FF0000', warning: '#FFA500', accent: '#FF4500',
    light: { bgMain: '#FFFBEB', bgSurface: '#FFFFFF', textMain: '#451A03', textMuted: '#92400E', borderMain: 'rgba(146, 64, 14, 0.1)', bgHover: '#FEF3C7' },
    dark: { bgMain: '#0F0F0F', bgSurface: '#1A1A1A', textMain: '#FDE68A', textMuted: '#D4AF37', borderMain: 'rgba(212, 175, 55, 0.1)', bgHover: '#262626' }
  },
  forest: {
    name: 'Toxic Forest',
    primary: '#39FF14', primaryContent: '#000000', success: '#00FF7F', danger: '#FF0033', warning: '#FFD700', accent: '#00FA9A',
    light: { bgMain: '#F0FDF4', bgSurface: '#FFFFFF', textMain: '#064E3B', textMuted: '#15803D', borderMain: 'rgba(6, 78, 59, 0.1)', bgHover: '#DCFCE7' },
    dark: { bgMain: '#021F17', bgSurface: '#064E3B', textMain: '#ECFDF5', textMuted: '#A7F3D0', borderMain: 'rgba(255, 255, 255, 0.05)', bgHover: '#065F46' }
  },
  glacier: {
    name: 'Arctic Glacier',
    primary: '#00FFFF', primaryContent: '#000000', success: '#7DF9FF', danger: '#FF007F', warning: '#FFBF00', accent: '#00BFFF',
    light: { bgMain: '#F0FDFF', bgSurface: '#FFFFFF', textMain: '#083344', textMuted: '#0E7490', borderMain: 'rgba(8, 51, 68, 0.1)', bgHover: '#CFFAFE' },
    dark: { bgMain: '#041724', bgSurface: '#082F49', textMain: '#E0F2FE', textMuted: '#7DD3FC', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#0C4A6E' }
  },
  volcano: {
    name: 'Volcanic Ash',
    primary: '#FF3333', primaryContent: '#FFFFFF', success: '#FF5555', danger: '#CC0000', warning: '#FF9900', accent: '#FF0055',
    light: { bgMain: '#FEF2F2', bgSurface: '#FFFFFF', textMain: '#450A0A', textMuted: '#991B1B', borderMain: 'rgba(69, 10, 10, 0.1)', bgHover: '#FEE2E2' },
    dark: { bgMain: '#240505', bgSurface: '#450A0A', textMain: '#FEE2E2', textMuted: '#FCA5A5', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#7F1D1D' }
  },
  monochrome: {
    name: 'Slate Minimal',
    primary: '#94A3B8', primaryContent: '#000000', success: '#CBD5E1', danger: '#64748B', warning: '#E2E8F0', accent: '#475569',
    light: { bgMain: '#F8FAFC', bgSurface: '#FFFFFF', textMain: '#0F172A', textMuted: '#475569', borderMain: 'rgba(15, 23, 42, 0.1)', bgHover: '#F1F5F9' },
    dark: { bgMain: '#080C17', bgSurface: '#0F172A', textMain: '#F8FAFC', textMuted: '#94A3B8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#1E293B' }
  },
  midnight: {
    name: 'Midnight Stealth',
    primary: '#00E5FF', primaryContent: '#000000', success: '#00FF88', danger: '#FF0044', warning: '#FFCC00', accent: '#FFFFFF',
    light: { bgMain: '#F0F9FF', bgSurface: '#FFFFFF', textMain: '#082F49', textMuted: '#075985', borderMain: 'rgba(8, 47, 73, 0.1)', bgHover: '#E0F2FE' },
    dark: { bgMain: '#000000', bgSurface: '#090909', textMain: '#FFFFFF', textMuted: '#A1A1AA', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#111111' }
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('zepglide_isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('zepglide_activeTheme') || 'ocean';
  });
  const [customTheme, setCustomTheme] = useState({ primary: '#10B981', bgMain: '#000000', bgSurface: '#111111', logoUrl: '' });

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

  useEffect(() => {
    localStorage.setItem('zepglide_isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('zepglide_activeTheme', activeTheme);
  }, [activeTheme]);

  // Compute theme data including custom brand
  const themeData = activeTheme === 'custom' ? {
    ...THEMES.ocean, // fallback base
    name: 'Custom Brand',
    primary: customTheme.primary || '#10B981',
    light: { ...THEMES.ocean.light, bgMain: customTheme.bgMain || '#F8FAFC', bgSurface: customTheme.bgSurface || '#FFFFFF' },
    dark: { ...THEMES.ocean.dark, bgMain: customTheme.bgMain || '#000000', bgSurface: customTheme.bgSurface || '#111111' }
  } : THEMES[activeTheme] || THEMES.ocean;

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
    const id = Date.now() + Math.random();
    setAppToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setAppToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  useEffect(() => {
    const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : 'http://localhost:3001');
    const socket = io(SIGNAL_URL, { transports: ['websocket', 'polling'] });

    socket.on('global-broadcast', (data) => {
       showAppToast(`BROADCAST: ${data.message}`, 'info');
    });

    return () => socket.close();
  }, [showAppToast]);

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
        activeTheme={activeTheme} setActiveTheme={setActiveTheme} 
        themes={THEMES} customTheme={customTheme} setCustomTheme={setCustomTheme}
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
      <Analytics />
    </div>
  );
}
