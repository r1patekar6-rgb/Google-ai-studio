
import React, { useState, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { PAY_NUMBER, RECIPIENT_NAME, UPI_ID, REPORT_EMAIL } from '../constants';
import { verifyPaymentScreenshot, sendPaymentNotification, logTransactionToLedger } from '../services/geminiService';
import { User, Subscription } from '../types';

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

  const MASTER_ACCESS_KEY = 'ivik@6';

  useEffect(() => {
    if (isUnlocked || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
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
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccessKeyCheck = (val: string) => {
    setAccessKey(val);
    if (val === MASTER_ACCESS_KEY) {
      setShowKeySuccess(true);
      setTimeout(() => {
        const dummySub: Subscription = {
          planAmount: amount,
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          remainingUses: 999,
          totalUses: 999
        };
        onVerified(dummySub);
      }, 800);
    }
  };

  const handleVerify = async () => {
    if (!fileBase64 || !transactionId) {
      setError("Please provide both the screenshot and the Transaction ID.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyPaymentScreenshot(fileBase64, transactionId);
      if (result.status === 'SUCCESS') {
        setIsSyncing(true);
        
        // Log to local ledger for monthly reporting
        logTransactionToLedger(amount, transactionId, currencyCode);

        // Auto-send the individual record to the owner's email
        await sendPaymentNotification({
          type: 'INDIVIDUAL_PAYMENT',
          screenshot: fileBase64,
          transactionId: transactionId,
          amount: amount,
          currency: currencyCode
        });

        const validityDays = result.validityDays || 1;
        const totalUses = result.totalUses || 1;
        
        const subscription: Subscription = {
          planAmount: amount,
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (validityDays * 24 * 60 * 60 * 1000)).toISOString(),
          remainingUses: totalUses,
          totalUses: totalUses
        };
        
        setIsSyncing(false);
        onVerified(subscription);
      } else {
        setError(result.message || t('verify_failed'));
      }
    } catch (err) {
      setError(t('verify_failed'));
    } finally {
      setIsVerifying(false);
    }
  };

  if (isUnlocked) {
    return (
      <div className="p-8 bg-emerald-600/10 border-2 border-emerald-500/30 rounded-[2.5rem] flex flex-col items-center gap-6 text-emerald-400 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0 animate-bounce">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white tracking-tight">{t('access_unlocked')}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Plan Activated Successfully</p>
        </div>
      </div>
    );
  }

  const paymentLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT_NAME)}&am=${amount}&cu=${currencyCode}&tn=BluePrint%20Passport%20Photo`;

  return (
    <div className={`space-y-8 glass-card p-6 md:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${isExpired ? 'opacity-75 border-rose-500/30' : 'border-blue-500/20 shadow-2xl'}`}>
      <div className="flex justify-center mb-2">
        <div className={`px-6 py-2 rounded-full border flex items-center gap-3 transition-colors ${timeLeft < 30 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span className="text-sm font-black tracking-widest uppercase">Session Expires: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 transition-colors ${isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
           <i className={`fa-solid ${isExpired ? 'fa-circle-exclamation' : 'fa-shield-halved'} text-2xl`}></i>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">
          {isExpired ? 'Session Expired' : t('pay_securely')}
        </h2>
        <p className="text-blue-200/60 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          {isExpired 
            ? 'The payment session has timed out. Please go back and select your plan again to restart the process.' 
            : `Pay ${currencySymbol}${amount} to ${RECIPIENT_NAME} first. Then upload your screenshot to activate your plan.`}
        </p>
      </div>

      {!isExpired && (
        <>
          <div className="flex flex-col items-center gap-6 bg-blue-950/40 p-8 rounded-[2.5rem] border border-blue-500/10 relative group">
            <div className="w-full max-w-sm">
              <a 
                href={paymentLink}
                className="group/pay relative w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 flex flex-col items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/pay:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-bolt-lightning text-white text-xl"></i>
                  <span className="text-2xl font-black text-white uppercase tracking-tighter">
                    {currencyCode === 'INR' ? 'UPI PAY' : 'DIRECT PAY'}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-blue-100/60">Pay {currencySymbol}${amount} First</span>
              </a>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Transaction ID / UTR (Mandatory)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-blue-500 pointer-events-none group-focus-within:text-blue-400">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <input 
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter 12-digit UTR or Transaction ID"
                  className="w-full bg-black/40 border border-blue-500/20 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-blue-900 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="w-full max-w-sm">
              <label className="block w-full cursor-pointer group relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className={`w-full py-6 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed transition-all ${selectedFile ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400' : 'bg-blue-900/10 border-blue-500/20 text-blue-400'}`}>
                  <i className={`fa-solid ${selectedFile ? 'fa-file-circle-check' : 'fa-camera-retro'} text-xl`}></i>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {selectedFile ? selectedFile.name.substring(0, 20) + '...' : t('upload_receipt')}
                  </span>
                </div>
              </label>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isVerifying || !transactionId || !selectedFile}
              className={`w-full max-w-sm py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                isVerifying || !transactionId || !selectedFile 
                ? 'bg-blue-900/40 text-blue-800 cursor-not-allowed border border-blue-500/10' 
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-2xl shadow-blue-500/30 animate-in zoom-in-95'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>{isSyncing ? 'SYNCING DATA...' : 'VERIFYING...'}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-shield-check"></i>
                  <span>VERIFY PAYMENT</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="max-w-sm mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest leading-relaxed">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                {error}
              </p>
            </div>
          )}

          <div className="max-w-sm mx-auto pt-6 border-t border-blue-500/10 space-y-4">
             <div className="text-center">
               <span className="text-[9px] font-black text-blue-500/40 uppercase tracking-[0.3em]">Access Key Management</span>
             </div>
             <div className="relative group">
                <div className={`absolute inset-y-0 left-4 flex items-center transition-colors ${showKeySuccess ? 'text-emerald-400' : 'text-amber-500/40 group-focus-within:text-amber-400'}`}>
                  <i className={`fa-solid ${showKeySuccess ? 'fa-circle-check' : 'fa-shield-keyhole'}`}></i>
                </div>
                <input 
                  type="text" 
                  value={accessKey}
                  onChange={(e) => handleAccessKeyCheck(e.target.value)}
                  placeholder="Enter Access Key..."
                  className={`w-full bg-blue-900/5 border rounded-xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none transition-all ${
                    showKeySuccess 
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' 
                    : 'border-blue-500/10 text-white placeholder:text-blue-900/30 focus:border-amber-500/30'
                  }`}
                />
             </div>
          </div>
        </>
      )}

      {isExpired && (
        <div className="flex flex-col items-center gap-6 py-10">
           <button 
            onClick={() => window.location.reload()}
            className="px-12 py-5 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-rose-500 transition-all uppercase tracking-widest"
           >
             Restart Process
           </button>
        </div>
      )}

      <p className="text-center text-[10px] text-blue-500 font-black uppercase tracking-[0.4em]">{t('secure_checkout')}</p>
    </div>
  );
};

export default PaymentVerification;
