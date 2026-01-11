
import React, { useState } from 'react';

interface PaymentVerificationProps {
  onVerified: () => void;
  isUnlocked: boolean;
}

const PaymentVerification: React.FC<PaymentVerificationProps> = ({ onVerified, isUnlocked }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'viki@40') {
      onVerified();
      setError(false);
    } else {
      setError(true);
      // Shake animation effect for error
      setTimeout(() => setError(false), 500);
    }
  };

  if (isUnlocked) {
    return (
      <div className="p-8 bg-emerald-600/10 border-2 border-emerald-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 text-emerald-400 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0 animate-bounce">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="text-center md:text-left">
          <p className="text-2xl font-black text-white tracking-tight">Access Unlocked!</p>
          <p className="text-sm font-bold text-emerald-400/80 mt-1">Your high-quality PNG and PDF exports are now ready for download below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 glass-card p-6 md:p-10 rounded-[2.5rem] border border-blue-500/20 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
      
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30 mb-4">
          <i className="fa-solid fa-lock-open text-3xl text-blue-400"></i>
        </div>
        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-blue-50 to-blue-400 tracking-tight">
          Enter Access Key
        </h2>
        <p className="text-blue-200/40 text-sm font-medium uppercase tracking-widest leading-relaxed">
          Provide your unique authorization code to enable high-resolution downloads.
        </p>
      </div>

      <form onSubmit={handleUnlock} className={`space-y-6 ${error ? 'animate-shake' : ''}`}>
        <div className="relative group">
          <i className="fa-solid fa-key absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/50 group-focus-within:text-blue-400 transition-colors"></i>
          <input 
            type="password" 
            placeholder="Enter authorization code..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-blue-950/40 border-2 ${error ? 'border-rose-500/50' : 'border-blue-500/20'} rounded-3xl py-6 pl-14 pr-6 text-xl font-bold text-white placeholder:text-blue-500/30 outline-none focus:border-blue-500/50 transition-all shadow-inner`}
          />
          {error && (
            <p className="absolute -bottom-6 left-6 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
              Incorrect authorization code
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 group"
        >
          UNLOCK HD ACCESS
          <i className="fa-solid fa-shield-check text-white group-hover:scale-125 transition-transform"></i>
        </button>
      </form>

      <div className="pt-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 w-full">
          <div className="h-[1px] flex-grow bg-blue-500/10"></div>
          <span className="text-[9px] font-black text-blue-500/40 uppercase tracking-[0.4em]">Security Information</span>
          <div className="h-[1px] flex-grow bg-blue-500/10"></div>
        </div>
        <p className="text-[10px] text-blue-400/50 font-medium text-center leading-relaxed">
          Don't have a code? Please contact support or your account administrator to obtain your high-quality download authorization key.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default PaymentVerification;
