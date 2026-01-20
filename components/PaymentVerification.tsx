
import React, { useState, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { PAY_NUMBER, RECIPIENT_NAME, UPI_ID, REPORT_EMAIL } from '../constants';
import { verifyPaymentScreenshot, sendPaymentNotification, logTransactionToLedger } from '../services/geminiService';
import { User, Subscription, VerificationStatus } from '../types';

interface PaymentVerificationProps {
  onVerified: (subscription: Subscription) => void;
  isUnlocked: boolean;
  amount: number;
  currencySymbol: string;
  currencyCode: string;
}

const PaymentVerification: React.FC<PaymentVerificationProps> = ({ onVerified, isUnlocked, amount, currencySymbol, currencyCode }) => {
  const { t } = useTranslation();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(174); // 2.9 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState('');
  const [showKeySuccess, setShowKeySuccess] = useState(false);

  const MASTER_ACCESS_KEY = 'RED@10';

  useEffect(() => {
    if (isUnlocked || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setIsExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isUnlocked, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setFileBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTransactionId('');
    setSelectedFile(null);
    setFileBase64(null);
    setAccessKey('');
  };

  const handleManualUnlock = () => {
    const cleanVal = accessKey.trim();
    if (cleanVal.toUpperCase() === MASTER_ACCESS_KEY.toUpperCase()) {
      setShowKeySuccess(true);
      setError(null);
      setTimeout(() => {
        const dummySub: Subscription = {
          planAmount: amount,
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          remainingUses: 999,
          totalUses: 999
        };
        resetForm();
        onVerified(dummySub);
      }, 600);
    } else {
      setError("Invalid Access Key. Please try again.");
      setShowKeySuccess(false);
    }
  };

  if (isUnlocked) {
    return (
      <div className="p-10 bg-blue-600/10 border-2 border-blue-500/40 rounded-[3rem] flex flex-col items-center gap-6 text-blue-400 shadow-[0_0_50px_rgba(37,99,235,0.2)] animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl shadow-3xl animate-bounce relative z-10 border-4 border-blue-400/50">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="text-center relative z-10">
          <p className="text-4xl font-black text-white tracking-tight mb-2">Verified & Unlocked</p>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Download Buttons Visible Below</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 bg-blue-950/40 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${isExpired ? 'opacity-75 border-rose-500/30' : 'border-blue-500/20 shadow-2xl animate-fade-in'}`}>
      <div className="flex justify-center mb-2">
        <div className={`px-6 py-2 rounded-full border flex items-center gap-3 transition-colors ${timeLeft < 30 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-blue-600/10 border-blue-500/20 text-blue-400'}`}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span className="text-sm font-black tracking-widest uppercase">Expires: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-blue-100 tracking-tight">{isExpired ? 'Session Expired' : t('pay_securely')}</h2>
        <p className="text-blue-400/60 text-sm font-black uppercase tracking-tighter">{isExpired ? 'Please restart.' : `Complete payment of ${currencySymbol}${amount} or use Access Key`}</p>
      </div>

      {!isExpired && (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-6 bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-500/10 relative">
            <div className="w-full max-w-sm space-y-4">
              <input 
                type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter Transaction ID (UTR)"
                className="w-full bg-blue-950/60 border border-blue-500/20 rounded-2xl py-4 px-6 text-white font-bold uppercase text-xs focus:border-blue-500 transition-colors outline-none"
              />
              <label className="block w-full cursor-pointer group relative">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className={`w-full py-6 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed transition-all ${selectedFile ? 'bg-blue-600/10 border-blue-400 text-blue-400' : 'bg-blue-900/10 border-blue-500/20 text-blue-500/50 hover:border-blue-500/40'}`}>
                  <i className={`fa-solid ${selectedFile ? 'fa-file-circle-check' : 'fa-camera-retro'} text-xl`}></i>
                  <span className="text-xs font-black uppercase tracking-widest">{selectedFile ? selectedFile.name.substring(0, 15) + '...' : t('upload_receipt')}</span>
                </div>
              </label>
            </div>
            <button 
              onClick={async () => {
                if (!fileBase64 || !transactionId) return;
                setIsVerifying(true);
                setError(null);
                try {
                  const result = await verifyPaymentScreenshot(fileBase64, transactionId);
                  if (result.status === VerificationStatus.SUCCESS) {
                    setIsSyncing(true);
                    logTransactionToLedger(result.amount || amount, transactionId, currencyCode);
                    await sendPaymentNotification({
                      type: 'PAYMENT_VERIFIED',
                      amount: result.amount || amount, currency: currencyCode,
                      txId: transactionId, timestamp: new Date().toISOString()
                    });
                    const newSubscription: Subscription = {
                      planAmount: result.amount || amount,
                      activatedAt: new Date().toISOString(),
                      expiresAt: new Date(Date.now() + (result.validityDays || 1) * 24 * 60 * 60 * 1000).toISOString(),
                      remainingUses: result.totalUses || 1,
                      totalUses: result.totalUses || 1
                    };
                    onVerified(newSubscription);
                    resetForm();
                  } else {
                    setError(result.message || "Verification failed.");
                  }
                } catch (err) {
                  setError("Verification error.");
                } finally {
                  setIsVerifying(false);
                  setIsSyncing(false);
                }
              }} 
              disabled={isVerifying || !transactionId || !selectedFile}
              className={`w-full max-w-sm py-5 rounded-2xl font-black text-lg transition-all ${isVerifying || !transactionId || !selectedFile ? 'bg-blue-900/40 text-blue-800' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl'}`}
            >
              {isVerifying ? 'VERIFYING...' : 'VERIFY PAYMENT'}
            </button>
          </div>
          
          <div className="max-w-sm mx-auto pt-8 border-t border-blue-500/10 w-full space-y-4">
             <div className="text-center">
               <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.5em]">Direct Studio Access Key</span>
             </div>
             <div className="flex gap-3">
                <div className="relative flex-grow">
                  <div className={`absolute inset-y-0 left-5 flex items-center transition-all ${showKeySuccess ? 'text-blue-500 scale-125' : 'text-blue-500/30'}`}>
                    <i className={`fa-solid ${showKeySuccess ? 'fa-circle-check' : 'fa-shield-keyhole'} text-xl`}></i>
                  </div>
                  <input 
                    type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="RED@10"
                    className={`w-full bg-blue-900/20 border-2 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-black uppercase tracking-[0.2em] transition-all outline-none ${showKeySuccess ? 'border-blue-500 bg-blue-600/10 text-blue-400 ring-4 ring-blue-500/20' : 'border-blue-500/10 text-white focus:border-blue-500/40'}`}
                  />
                </div>
                <button 
                  onClick={handleManualUnlock}
                  disabled={!accessKey.trim()}
                  className={`px-8 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 group ${accessKey.trim() ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95' : 'bg-blue-900/40 text-blue-800 cursor-not-allowed'}`}
                >
                  <i className="fa-solid fa-key group-hover:rotate-12 transition-transform"></i>
                  <span>Unlock</span>
                </button>
             </div>
             {error && (
                <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest animate-fade-in"><i className="fa-solid fa-circle-xmark mr-2"></i>{error}</p>
              )}
          </div>
        </div>
      )}
      {isExpired && (
        <div className="flex justify-center py-10">
           <button onClick={() => window.location.reload()} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest">Restart</button>
        </div>
      )}
      <p className="text-center text-[10px] text-blue-500/30 font-black uppercase tracking-[0.5em]">{t('secure_checkout')}</p>
    </div>
  );
};

export default PaymentVerification;
