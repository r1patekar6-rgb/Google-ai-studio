
import React, { useState } from 'react';
import { useTranslation } from './TranslationContext';
import { User } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
  onSwitchToSignUp: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, onSwitchToSignUp }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

  // Strong Password Validation Rules
  const hasTwoAlphabets = (s: string) => (s.match(/[a-zA-Z]/g) || []).length >= 2;
  const hasOneSymbol = (s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s);
  const hasThreeDigits = (s: string) => (s.match(/[0-9]/g) || []).length >= 3;
  
  const isPasswordSecure = hasTwoAlphabets(password) && hasOneSymbol(password) && hasThreeDigits(password);
  const passwordsMatch = password !== '' && password === confirmPassword;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
      const inputTrimmed = identifier.trim();
      const inputNormalized = normalizePhone(inputTrimmed);
      
      const user = userLedger.find((u: User) => {
        const matchesEmail = u.email?.toLowerCase() === inputTrimmed.toLowerCase();
        const storedPhoneNormalized = normalizePhone(u.phone || '');
        const matchesPhone = inputNormalized.length >= 10 && storedPhoneNormalized.endsWith(inputNormalized.slice(-10));
        const matchesPassword = u.password === password;
        return (matchesEmail || matchesPhone) && matchesPassword;
      });

      if (user) {
        localStorage.setItem('bp_user', JSON.stringify({ name: user.name, email: user.email }));
        onSuccess(user.name, user.email);
        onClose();
      } else {
        setError('Incorrect login details. If you forgot your password, please use the reset link below.');
      }
      setIsSubmitting(false);
    }, 1200);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier.trim()) {
      setError('Enter your registered Email or Phone to identify your account.');
      return;
    }

    if (!isPasswordSecure) {
      setError('Please create a strong password using the rules below.');
      return;
    }

    if (!passwordsMatch) {
      setError('Confirmation password does not match.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
      const inputTrimmed = identifier.trim();
      const inputNormalized = normalizePhone(inputTrimmed);

      const userIndex = userLedger.findIndex((u: User) => {
        const matchesEmail = u.email?.toLowerCase() === inputTrimmed.toLowerCase();
        const storedPhoneNormalized = normalizePhone(u.phone || '');
        const matchesPhone = inputNormalized.length >= 10 && storedPhoneNormalized.endsWith(inputNormalized.slice(-10));
        return matchesEmail || matchesPhone;
      });

      if (userIndex !== -1) {
        // Update security credentials in the Studio Ledger
        userLedger[userIndex].password = password;
        localStorage.setItem('bp_user_ledger', JSON.stringify(userLedger));
        
        setSuccessMsg('Account recovered! Your new strong password is now active.');
        setTimeout(() => {
          setView('login');
          setPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
        }, 2500);
      } else {
        setError('We could not find a Studio account with these details.');
      }
      setIsSubmitting(false);
    }, 1800);
  };

  const isFormFilled = identifier.trim().length > 0 && password.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-lg glass-card rounded-[3.5rem] border border-blue-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors z-20"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="p-10 md:p-14 space-y-10">
          <div className="text-center space-y-3">
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-2xl transition-all duration-500 ${view === 'login' ? 'bg-blue-600 shadow-blue-600/30 rotate-0' : 'bg-amber-500 shadow-amber-500/30 rotate-12'}`}>
              <i className={`fa-solid ${view === 'login' ? 'fa-fingerprint' : 'fa-user-shield'}`}></i>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                {view === 'login' ? t('login') : 'Account Recovery'}
              </h2>
              <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Welcome to Passport Studio</p>
              <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.4em]">
                {view === 'login' ? 'Authorized Access Only' : 'Create a New Secure Password'}
              </p>
            </div>
          </div>

          <form onSubmit={view === 'login' ? handleLogin : handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Identity Details</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-blue-500/40 group-focus-within:text-blue-400 transition-colors">
                  <i className="fa-solid fa-address-card"></i>
                </div>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full bg-blue-950/40 border border-blue-500/20 rounded-[1.5rem] py-5 pl-14 pr-6 text-white placeholder:text-blue-900 focus:outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="Registered Email or Phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  {view === 'login' ? 'Passcode' : 'Create New Strong Password'}
                </label>
                {view === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); setError(''); }}
                    className="text-[9px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-circle-question"></i>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-blue-500/40 group-focus-within:text-blue-400 transition-colors">
                  <i className="fa-solid fa-key"></i>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-blue-950/40 border border-blue-500/20 rounded-[1.5rem] py-5 pl-14 pr-14 text-white placeholder:text-blue-900 focus:outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder={view === 'login' ? "Enter password" : "New strong password"}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500/50 hover:text-blue-400"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {view === 'forgot' && (
              <>
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-400">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Repeat Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-blue-500/40 group-focus-within:text-blue-400 transition-colors">
                      <i className="fa-solid fa-shield-check"></i>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full bg-blue-950/40 border rounded-[1.5rem] py-5 pl-14 pr-6 text-white placeholder:text-blue-900 focus:outline-none transition-all font-bold ${
                        confirmPassword === '' ? 'border-blue-500/20' : 
                        passwordsMatch ? 'border-emerald-500/40' : 'border-rose-500/40'
                      }`}
                      placeholder="Verify new password"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10 space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-lock-open-alt"></i> Security Checklist
                    </h4>
                    {isPasswordSecure && <span className="text-[8px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded-md">Validated</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center gap-2 text-[8px] font-black uppercase transition-colors ${hasTwoAlphabets(password) ? 'text-emerald-400' : 'text-blue-500/30'}`}>
                      <i className={`fa-solid ${hasTwoAlphabets(password) ? 'fa-circle-check' : 'fa-circle'} text-[8px]`}></i>
                      2 Alphabets
                    </div>
                    <div className={`flex items-center gap-2 text-[8px] font-black uppercase transition-colors ${hasOneSymbol(password) ? 'text-emerald-400' : 'text-blue-500/30'}`}>
                      <i className={`fa-solid ${hasOneSymbol(password) ? 'fa-circle-check' : 'fa-circle'} text-[8px]`}></i>
                      1 Special Char
                    </div>
                    <div className={`flex items-center gap-2 text-[8px] font-black uppercase transition-colors ${hasThreeDigits(password) ? 'text-emerald-400' : 'text-blue-500/30'}`}>
                      <i className={`fa-solid ${hasThreeDigits(password) ? 'fa-circle-check' : 'fa-circle'} text-[8px]`}></i>
                      3 Numbers
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in shake duration-300">
                <p className="text-center text-rose-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                  {error}
                </p>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95 duration-500">
                <p className="text-center text-emerald-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  <i className="fa-solid fa-circle-check mr-2"></i>
                  {successMsg}
                </p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || (view === 'login' && !isFormFilled) || (view === 'forgot' && (!isPasswordSecure || !passwordsMatch))}
              className={`w-full py-6 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-4 ${
                isSubmitting || (view === 'login' && !isFormFilled) || (view === 'forgot' && (!isPasswordSecure || !passwordsMatch))
                ? 'bg-blue-900/40 text-blue-800 cursor-not-allowed border border-blue-500/10' 
                : view === 'login' 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl shadow-blue-600/30' 
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-3xl shadow-amber-600/30'
              } active:scale-[0.97]`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className={`fa-solid ${view === 'login' ? 'fa-unlock-keyhole' : 'fa-user-pen'}`}></i>
                  <span>{view === 'login' ? 'Unlock Studio' : 'Reset My Password'}</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest">
                {view === 'login' ? (
                  <>
                    First time at the Studio?{' '}
                    <button 
                      type="button" 
                      onClick={onSwitchToSignUp}
                      className="text-blue-400 hover:text-white transition-colors underline decoration-blue-500/30 underline-offset-8"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setView('login'); setError(''); }}
                    className="text-blue-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <i className="fa-solid fa-arrow-left text-[8px]"></i>
                    Return to Login
                  </button>
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
