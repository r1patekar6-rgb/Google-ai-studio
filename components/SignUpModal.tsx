
import React, { useState } from 'react';
import { useTranslation } from './TranslationContext';
import { logUserToLedger } from '../services/geminiService';
import { User } from '../types';

interface SignUpModalProps {
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
  onSwitchToLogin?: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose, onSuccess, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showLoginShortcut, setShowLoginShortcut] = useState(false);
  const [duplicateField, setDuplicateField] = useState<string | null>(null);

  // Validation helpers
  const hasTwoAlphabets = (s: string) => (s.match(/[a-zA-Z]/g) || []).length >= 2;
  const hasOneSymbol = (s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s);
  const hasThreeDigits = (s: string) => (s.match(/[0-9]/g) || []).length >= 3;
  
  const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

  const isPasswordSecure = hasTwoAlphabets(formData.password) && 
                           hasOneSymbol(formData.password) && 
                           hasThreeDigits(formData.password);

  const passwordsMatch = formData.password !== '' && formData.password === formData.confirmPassword;
  const isFormValid = isPasswordSecure && passwordsMatch && formData.name && formData.email && formData.phone;

  const checkDuplicate = (type: 'email' | 'phone', value: string) => {
    if (!value) return;
    const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    
    if (type === 'email') {
      const emailMatch = userLedger.find((u: User) => u.email.toLowerCase() === value.trim().toLowerCase());
      if (emailMatch) {
        setDuplicateField('email');
        setError('This email is already associated with a Studio account.');
        setShowLoginShortcut(true);
      } else if (duplicateField === 'email') {
        setDuplicateField(null);
        setError('');
        setShowLoginShortcut(false);
      }
    } else {
      const normValue = normalizePhone(value);
      const phoneMatch = userLedger.find((u: User) => normalizePhone(u.phone || '').endsWith(normValue.slice(-10)));
      if (phoneMatch && normValue.length >= 10) {
        setDuplicateField('phone');
        setError('This mobile number is already registered.');
        setShowLoginShortcut(true);
      } else if (duplicateField === 'phone') {
        setDuplicateField(null);
        setError('');
        setShowLoginShortcut(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateField) return;

    setError('');
    setShowLoginShortcut(false);

    if (!isPasswordSecure) {
      setError('Password does not meet security requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please enter the same password again.');
      return;
    }

    // Final check before logging
    const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    const inputEmail = formData.email.trim().toLowerCase();
    const inputPhone = normalizePhone(formData.phone);

    const existingByEmail = userLedger.find((u: any) => u.email.toLowerCase() === inputEmail);
    const existingByPhone = userLedger.find((u: any) => normalizePhone(u.phone || '').endsWith(inputPhone.slice(-10)));
    
    if (existingByEmail || existingByPhone) {
      setError(`Account already exists. Please login instead of creating a duplicate.`);
      setShowLoginShortcut(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const { confirmPassword, ...userDataToLog } = formData;
      logUserToLedger(userDataToLog);
      localStorage.setItem('bp_user', JSON.stringify({ name: formData.name, email: formData.email }));
      setIsSubmitting(false);
      onSuccess(formData.name, formData.email);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-3xl glass-card rounded-[3rem] border border-blue-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors z-20"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="p-8 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-xl shadow-xl shadow-blue-600/20 mb-4">
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">{t('sign_up')}</h2>
            <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Welcome to Passport Studio</p>
            <p className="text-blue-300/50 text-[10px] font-black uppercase tracking-[0.3em]">{t('auth_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">{t('full_name')}</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-blue-900/10 border border-blue-500/20 rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">{t('phone_number')}</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onBlur={() => checkDuplicate('phone', formData.phone)}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full bg-blue-900/10 border rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none transition-all font-bold ${duplicateField === 'phone' ? 'border-rose-500/50' : 'border-blue-500/20 focus:border-blue-500'}`}
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">{t('email_id')}</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onBlur={() => checkDuplicate('email', formData.email)}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-blue-900/10 border rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none transition-all font-bold ${duplicateField === 'email' ? 'border-rose-500/50' : 'border-blue-500/20 focus:border-blue-500'}`}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">{t('create_password')}</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-blue-900/10 border border-blue-500/20 rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Enter strong password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50 hover:text-blue-400"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full bg-blue-900/10 border rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none transition-all font-bold ${
                        formData.confirmPassword === '' ? 'border-blue-500/20' : 
                        passwordsMatch ? 'border-emerald-500/40' : 'border-rose-500/40'
                      }`}
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 self-stretch">
                <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-shield-check text-blue-400"></i>
                  Security Rules
                </h4>
                <div className="space-y-2">
                  <div className={`flex items-center gap-3 text-[9px] font-bold uppercase transition-colors ${hasTwoAlphabets(formData.password) ? 'text-emerald-400' : 'text-blue-200/40'}`}>
                    <i className={`fa-solid ${hasTwoAlphabets(formData.password) ? 'fa-check' : 'fa-circle-dot'} w-4`}></i>
                    2 Letters
                  </div>
                  <div className={`flex items-center gap-3 text-[9px] font-bold uppercase transition-colors ${hasOneSymbol(formData.password) ? 'text-emerald-400' : 'text-blue-200/40'}`}>
                    <i className={`fa-solid ${hasOneSymbol(formData.password) ? 'fa-check' : 'fa-circle-dot'} w-4`}></i>
                    1 Symbol
                  </div>
                  <div className={`flex items-center gap-3 text-[9px] font-bold uppercase transition-colors ${hasThreeDigits(formData.password) ? 'text-emerald-400' : 'text-blue-200/40'}`}>
                    <i className={`fa-solid ${hasThreeDigits(formData.password) ? 'fa-check' : 'fa-circle-dot'} w-4`}></i>
                    3 Numbers
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {error && (
                <div className="flex flex-col items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in zoom-in-95 duration-200">
                  <p className="text-center text-rose-500 text-[10px] font-black uppercase tracking-widest">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    {error}
                  </p>
                  {showLoginShortcut && onSwitchToLogin && (
                    <button 
                      type="button"
                      onClick={onSwitchToLogin}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-right-to-bracket"></i>
                      Login to your Studio Account
                    </button>
                  )}
                </div>
              )}

              {!showLoginShortcut && (
                <button 
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full py-6 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                    isSubmitting || !isFormValid
                    ? 'bg-blue-900/40 text-blue-800 cursor-not-allowed border border-blue-500/10' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl shadow-blue-600/30 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-rocket"></i>
                      <span>{t('register_now')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-[10px] font-black text-blue-300/40 uppercase tracking-widest">
                Already registered?{' '}
                <button 
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-400 hover:text-white transition-colors underline decoration-blue-500/30 underline-offset-4"
                >
                  Login Now
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
