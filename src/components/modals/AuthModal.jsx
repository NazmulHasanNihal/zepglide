import React, { useState } from 'react';
import { X, Zap, UserCircle, Mail, Fingerprint, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthModal({ onLogin, onClose, showToast }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLoginView) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        if (data.session) onLogin();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        });
        
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
           if (showToast) showToast('Email already in use!', 'error');
           return;
        }
        if (showToast) showToast('Check your email for the confirmation link!', 'success');
        setIsLoginView(true); // Switch to login after signup
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Authentication failed', 'error');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500 font-sans">
      <div className="absolute inset-0 bg-[#353b48]/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="w-full max-w-[420px] bg-[#434b58] border border-white/5 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]"></div>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all z-20 active:scale-95"><X size={18} strokeWidth={2.5} /></button>
        <div className="p-8 md:p-10 relative">
          <div className="flex flex-col items-center mb-10 text-white">
            <div className="h-16 w-16 bg-[var(--primary)] text-white rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm"><Zap size={32} strokeWidth={3} className="fill-current" /></div>
            <h2 className="text-[22px] font-black mb-2 tracking-wide uppercase">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-sm font-medium text-white/60 text-center leading-relaxed">{isLoginView ? 'Sign in to your high-velocity file network.' : 'Initialize your unique node identity.'}</p>
          </div>
          <form key={isLoginView ? 'login' : 'signup'} onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {!isLoginView && (
              <AuthInput label="Alias Name" type="text" placeholder="User_Alpha" value={formData.name} onChange={v => setFormData({...formData, name: v})} icon={<UserCircle size={18} strokeWidth={2.5} />} />
            )}
            <AuthInput label="Email Address" type="email" placeholder="name@email.com" value={formData.email} onChange={v => setFormData({...formData, email: v})} icon={<Mail size={18} strokeWidth={2.5} />} />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1 mb-1">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.1em]">Password</label>
                {isLoginView && <button type="button" onClick={async () => {
                  if (!formData.email) { if (showToast) showToast('Enter your email first', 'info'); return; }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                      redirectTo: window.location.origin
                    });
                    if (error) throw error;
                    if (showToast) showToast('Password reset email sent! Check your inbox.', 'success');
                  } catch (err) {
                    if (showToast) showToast(err.message || 'Failed to send reset email', 'error');
                  }
                }} className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline">Forgot?</button>}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors"><Fingerprint size={18} strokeWidth={2.5} /></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#353b48] border border-white/5 text-white text-sm rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all font-bold placeholder-white/30 tracking-widest" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors active:scale-95">
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div className="mt-4 p-[2px] rounded-[14px] bg-gradient-to-r from-[var(--primary-30)] via-[var(--accent-50)] to-[var(--primary-30)] shadow-[0_0_15px_var(--primary-20)]">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#434b58] hover:bg-[#3b4350] active:scale-[0.98] text-[var(--primary)] font-black py-4 rounded-xl transition-all duration-300 uppercase tracking-wider text-xs flex justify-center items-center"
              >
                <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] bg-clip-text text-transparent px-8 bg-[var(--primary-10)] rounded-full py-1">
                  {isLoading ? 'Authorizing...' : isLoginView ? 'Sign In' : 'Sign Up'}
                </div>
              </button>
            </div>
          </form>
        </div>
        <div className="pb-8 text-center bg-[#434b58]"><button type="button" onClick={() => setIsLoginView(!isLoginView)} className="text-[11px] font-black text-[var(--primary)] uppercase tracking-[0.1em] hover:brightness-125 transition-all">{isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button></div>
      </div>
    </div>
  );
}

function AuthInput({ label, type, placeholder, icon, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.1em] ml-1">{label}</label>
      <div className="relative group text-white">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">{icon}</div>
        <input 
          type={type} 
          required 
          placeholder={placeholder} 
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#353b48] border border-white/5 text-white text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all font-bold placeholder-white/30" 
        />
      </div>
    </div>
  );
}
