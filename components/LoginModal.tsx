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
  const [recoveryStep, setRecoveryStep] = useState<'identify' | 'otp' | 'reset'>('identify');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [otp, setOtp] = useState('');
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

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    const inputTrimmed = identifier.trim();
    const inputNormalized = normalizePhone(inputTrimmed);

    const user = userLedger.find((u: User) => {
      const matchesEmail = u.email?.toLowerCase() === inputTrimmed.toLowerCase();
      const storedPhoneNormalized = normalizePhone(u.phone || '');
      return matchesEmail || (inputNormalized.length >= 10 && storedPhoneNormalized.endsWith(inputNormalized.slice(-10)));
    });

    if (user) {
      setIsSubmitting(true);
      setTimeout(() => {
        setRecoveryStep('otp');
        setIsSubmitting(false);
        setSuccessMsg(`Verification code sent to your registered ${identifier.includes('@') ? 'Email' : 'Phone'}.`);
      }, 1000);
    } else {
      setError('Account not found. Please check your details or Sign Up.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Simulated OTP check (accepts '123456' or any 6 digits for demo purposes)
    if (otp.length === 6) {
      setIsSubmitting(true);
      setTimeout(() => {
        setRecoveryStep('reset');
        setIsSubmitting(false);
        setSuccessMsg('Identity verified! Create your new password below.');
      }, 1000);
    } else {
      setError('Invalid code. Please enter the 6-digit code sent to your device.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
        return matchesEmail || (inputNormalized.length >= 10 && storedPhoneNormalized.endsWith(inputNormalized.slice(-10)));
      });

      if (userIndex !== -1) {
        userLedger[userIndex].password = password;
        localStorage.setItem('bp_user_ledger', JSON.stringify(userLedger));
        
        setSuccessMsg('Account recovered! Your new password is now active.');
        setTimeout(() => {
          setView('login');
          setRecoveryStep('identify');
          setPassword('');
          setConfirmPassword('');
          setOtp('');
          setSuccessMsg('');
        }, 2000);
      } else {
        setError('Recovery error. Please try again.');
        setRecoveryStep('identify');
      }
      setIsSubmitting(false);
    }, 1500);
  };

  const isFormFilled = identifier.trim().length > 0 && password.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg glass-card rounded-[3.5rem] border border-blue-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
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
              {view === 'forgot' && (
                <div className="flex justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${recoveryStep === 'identify' ? 'bg-blue-500' : 'bg-blue-900'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${recoveryStep === 'otp' ? 'bg-blue-500' : 'bg-blue-900'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${recoveryStep === 'reset' ? 'bg-blue-500' : 'bg-blue-900'}`}></div>
                </div>
              )}
              <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs mt-2">
                {view === 'login' ? 'Authorized Access Only' : recoveryStep === 'identify' ? 'Step 1: Identify Account' : recoveryStep === 'otp' ? 'Step 2: Verify Identity' : 'Step 3: New Password'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
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
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Passcode</label>
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setRecoveryStep('identify'); setError(''); setSuccessMsg(''); }}
                      className="text-[9px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-circle-question"></i>
                      Forgot Password?
                    </button>
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
                      placeholder="Enter password"
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

                <button 
                  type="submit"
                  disabled={isSubmitting || !isFormFilled}
                  className={`w-full py-6 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-4 ${
                    isSubmitting || !isFormFilled
                    ? 'bg-blue-900/40 text-blue-800 cursor-not-allowed border border-blue-500/10' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl shadow-blue-600/30'
                  } active:scale-[0.97]`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-unlock-keyhole"></i>
                      <span>Unlock Studio</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {recoveryStep === 'identify' && (
                  <form onSubmit={handleIdentify} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Find your Account</label>
                      <input 
                        type="text" 
                        required
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        className="w-full bg-blue-950/40 border border-blue-500/20 rounded-[1.5rem] py-5 px-6 text-white placeholder:text-blue-900 focus:outline-none focus:border-blue-500 transition-all font-bold"
                        placeholder="Email or Phone"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting || !identifier.trim()}
                      className="w-full py-6 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Send Verification Code'}
                    </button>
                  </form>
                )}

                {recoveryStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Verification Code</label>
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-blue-950/40 border border-blue-500/20 rounded-[1.5rem] py-6 text-center text-3xl tracking-[0.5em] text-white focus:outline-none focus:border-blue-500 transition-all font-black"
                        placeholder="000000"
                      />
                      <p className="text-[8px] font-black text-blue-500/40 uppercase tracking-widest mt-2">Check your device for the 6-digit code</p>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting || otp.length < 6}
                      className="w-full py-6 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg shadow-xl transition-all"
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Verify Code'}
                    </button>
                  </form>
                )}

                {recoveryStep === 'reset' && (
                  <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">New Secure Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-blue-950/40 border border-blue-500/20 rounded-[1.5rem] py-5 px-6 text-white placeholder:text-blue-900 focus:outline-none focus:border-blue-500 transition-all font-bold"
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Confirm New Password</label>
                        <input 
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`w-full bg-blue-950/40 border rounded-[1.5rem] py-5 px-6 text-white placeholder:text-blue-900 focus:outline-none transition-all font-bold ${passwordsMatch ? 'border-emerald-500/40' : 'border-rose-500/40'}`}
                          placeholder="Repeat new password"
                        />
                      </div>
                    </div>

                    <div className="p-5 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10 space-y-2">
                      <h4 className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Requirements:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <span className={`text-[8px] font-black ${hasTwoAlphabets(password) ? 'text-emerald-500' : 'text-blue-500/40'}`}>2 Letters</span>
                        <span className={`text-[8px] font-black ${hasOneSymbol(password) ? 'text-emerald-500' : 'text-blue-500/40'}`}>1 Special</span>
                        <span className={`text-[8px] font-black ${hasThreeDigits(password) ? 'text-emerald-500' : 'text-blue-500/40'}`}>3 Numbers</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !isPasswordSecure || !passwordsMatch}
                      className={`w-full py-6 rounded-[1.5rem] font-black text-lg transition-all ${isPasswordSecure && passwordsMatch ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-900/40 cursor-not-allowed'} text-white shadow-xl`}
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
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
                    onClick={() => { setView('login'); setRecoveryStep('identify'); setError(''); setSuccessMsg(''); setOtp(''); }}
                    className="text-blue-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <i className="fa-solid fa-arrow-left text-[8px]"></i>
                    Return to Login
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;