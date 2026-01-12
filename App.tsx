
import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import PhotoEditor from './components/PhotoEditor';
import LayoutReview from './components/LayoutReview';
import PaymentVerification from './components/PaymentVerification';
import SignUpModal from './components/SignUpModal';
import LoginModal from './components/LoginModal';
import { PhotoSize, PaperLayout, PhotoConfig, User, Subscription } from './types';
import { 
  INR_PRICING, USD_PRICING, 
  INR_BULK_PLANS, USD_BULK_PLANS, 
  PAPER_DIMENSIONS, PHOTO_DIMENSIONS, 
  COMPLAINT_WHATSAPP, INDIAN_LANGUAGES 
} from './constants';
import { jsPDF } from 'jspdf';
import { TranslationProvider, useTranslation } from './components/TranslationContext';
import { checkAndSendMonthlyReport, checkAndSendUserReport } from './services/geminiService';

const QUALITY_BENEFITS = {
  Standard: {
    dpi: 72,
    use: 'Web & Screen',
    speed: 'Instant',
    icon: 'fa-display',
    desc: 'Faster processing for digital records'
  },
  High: {
    dpi: 150,
    use: 'Home Printing',
    speed: 'Fast',
    icon: 'fa-print',
    desc: 'Sharp results for home inkjet printers'
  },
  Maximum: {
    dpi: 300,
    use: 'Studio Grade',
    speed: 'Optimal',
    icon: 'fa-award',
    desc: 'Official pro-lab resolution (Recommended)'
  }
};

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); 
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/20 opacity-40"></div>
      
      <div className="flex flex-col items-center gap-10 relative z-10 animate-in zoom-in-95 duration-1000">
        <div className="relative">
          <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-3xl backdrop-blur-2xl border border-white/10 overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-blue-600/40 transition-colors"></div>
            <i className="fa-solid fa-passport text-white text-6xl relative z-10 drop-shadow-lg"></i>
          </div>
          <div className="absolute -inset-4 border border-blue-500/20 rounded-[3.5rem] animate-pulse"></div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            Orgeta
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-blue-500/40"></div>
            <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.6em] animate-pulse">
              AI PASSPORT STUDIO
            </p>
            <div className="h-px w-8 bg-blue-500/40"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-16 text-center space-y-6">
        <div className="w-64 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 w-full animate-progress-premium origin-left"></div>
        </div>
        <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.4em]">Initializing Neutral Engine</p>
      </div>

      <style>{`
        @keyframes progress-premium {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-progress-premium {
          animation: progress-premium 2.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, language } = useTranslation();
  const [isSplash, setIsSplash] = useState(true);
  const [step, setStep] = useState<'home' | 'editor' | 'review' | 'payment'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [editedPhoto, setEditedPhoto] = useState<string | null>(null);
  const [config, setConfig] = useState<PhotoConfig>({
    size: PhotoSize.INDIA_PASSPORT,
    layout: PaperLayout.A4
  });
  const [selectedAmount, setSelectedAmount] = useState<number>(37);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [downloadQuality, setDownloadQuality] = useState<'Standard' | 'High' | 'Maximum'>('Maximum');
  const [isRendering, setIsRendering] = useState(false);
  
  // Auth initialization
  useEffect(() => {
    const saved = localStorage.getItem('bp_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // Determine pricing locale
  const isInternational = !INDIAN_LANGUAGES.includes(language.name);
  const activePricing = isInternational ? USD_PRICING : INR_PRICING;
  const activeBulk = isInternational ? USD_BULK_PLANS : INR_BULK_PLANS;
  const currencySymbol = isInternational ? '$' : '₹';
  const currencyCode = isInternational ? 'USD' : 'INR';

  useEffect(() => {
    checkAndSendMonthlyReport();
    checkAndSendUserReport();
  }, []);

  const isSubscriptionValid = (u: User | null): boolean => {
    if (!u || !u.subscription) return false;
    const now = new Date();
    const expiry = new Date(u.subscription.expiresAt);
    return now < expiry && u.subscription.remainingUses > 0;
  };

  const handleLogout = () => {
    localStorage.removeItem('bp_user');
    setUser(null);
    setStep('home');
  };

  const handleAuthSuccess = (name: string, email: string) => {
    const savedUsers = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    const currentUser = savedUsers.find((u: User) => u.email === email);
    
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem('bp_user', JSON.stringify(currentUser));
    } else {
      const newUser: User = { name, email, phone: '', profileImage: null };
      setUser(newUser);
      localStorage.setItem('bp_user', JSON.stringify(newUser));
    }
    setShowSignUp(false);
    setShowLogin(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('bp_user', JSON.stringify(updatedUser));
  };

  // Fix: Added missing handleVerificationSuccess function to update user subscription state
  const handleVerificationSuccess = (subscription: Subscription) => {
    setIsUnlocked(true);
    if (user) {
      const updatedUser: User = {
        ...user,
        subscription: subscription
      };
      handleUpdateUser(updatedUser);

      // Also ensure the user ledger is updated with the new subscription
      try {
        const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
        const updatedLedger = userLedger.map((u: User) => u.email === user.email ? updatedUser : u);
        localStorage.setItem('bp_user_ledger', JSON.stringify(updatedLedger));
      } catch (e) {
        console.error("Ledger sync error during verification", e);
      }
    }
  };

  const resetToHome = () => {
    setStep('home');
    setUserPhoto(null);
    setEditedPhoto(null);
    setIsUnlocked(false);
    setHasDownloaded(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserPhoto(reader.result as string);
        setEditedPhoto(null);
        setStep('editor');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPlan = (amount: number) => {
    setSelectedAmount(amount);
    const input = document.getElementById('main-upload') as HTMLInputElement;
    input?.click();
  };

  const currentPhotoCount = activePricing.find(p => p.amount === selectedAmount)?.photos || activeBulk.find(p => p.amount === selectedAmount)?.amount || 21;

  const generateGridCanvases = async (quality: 'Standard' | 'High' | 'Maximum'): Promise<HTMLCanvasElement[]> => {
    const dpi = quality === 'Maximum' ? 300 : quality === 'High' ? 150 : 72;
    const paper = PAPER_DIMENSIONS[config.layout];
    const photo = PHOTO_DIMENSIONS[config.size];
    const mmToPx = (mm: number) => (mm / 25.4) * dpi;
    const gap = mmToPx(1.5);
    const padding = mmToPx(8);
    const photoW = mmToPx(photo.width);
    const photoH = mmToPx(photo.height);
    const canvasW = mmToPx(paper.width);
    const canvasH = mmToPx(paper.height);
    const effectiveWidth = canvasW - (padding * 2);
    const effectiveHeight = canvasH - (padding * 2);
    const cols = Math.max(1, Math.floor((effectiveWidth + gap) / (photoW + gap)));
    const rows = Math.max(1, Math.floor((effectiveHeight + gap) / (photoH + gap)));
    const photosPerPage = cols * rows;
    const totalPages = Math.ceil(currentPhotoCount / photosPerPage);
    const canvases: HTMLCanvasElement[] = [];

    const img = new Image();
    img.src = editedPhoto!;
    await new Promise((resolve) => { img.onload = resolve; });

    for (let p = 0; p < totalPages; p++) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const totalGridWidth = (cols * photoW) + ((cols - 1) * gap);
      const startX = (canvas.width - totalGridWidth) / 2;
      const startIdx = p * photosPerPage;
      const endIdx = Math.min(startIdx + photosPerPage, currentPhotoCount);
      const photosOnThisPage = endIdx - startIdx;

      for (let i = 0; i < photosOnThisPage; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * (photoW + gap);
        const y = padding + row * (photoH + gap);
        ctx.drawImage(img, x, y, photoW, photoH);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = Math.max(0.5, dpi / 600);
        ctx.strokeRect(x, y, photoW, photoH);
      }
      canvases.push(canvas);
    }
    return canvases;
  };

  const handleDownload = async (format: 'PNG' | 'PDF') => {
    if (hasDownloaded) return;
    if (!isSubscriptionValid(user)) {
      alert("Your plan has expired or no uses are left. Please activate a new plan.");
      return;
    }

    setIsRendering(true);
    try {
      const canvases = await generateGridCanvases(downloadQuality);
      const fileName = `Orgeta_Export_${new Date().getTime()}`;
      if (format === 'PNG') {
        canvases.forEach((canvas, index) => {
          const link = document.createElement('a');
          link.download = canvases.length > 1 ? `${fileName}_P${index + 1}.png` : `${fileName}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      } else {
        const paper = PAPER_DIMENSIONS[config.layout];
        const pdf = new jsPDF({
          orientation: paper.width > paper.height ? 'l' : 'p',
          unit: 'mm',
          format: [paper.width, paper.height]
        });
        canvases.forEach((canvas, index) => {
          if (index > 0) pdf.addPage([paper.width, paper.height], paper.width > paper.height ? 'l' : 'p');
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height);
        });
        pdf.save(`${fileName}.pdf`);
      }
      
      if (user && user.subscription) {
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            remainingUses: user.subscription.remainingUses - 1
          }
        };
        handleUpdateUser(updatedUser);
      }
      setHasDownloaded(true);
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setIsRendering(false);
    }
  };

  if (isSplash) return <SplashScreen onComplete={() => setIsSplash(false)} />;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#000000] text-white overflow-hidden">
        <Header onHome={() => {}} user={null} onLogout={() => {}} onUpdateUser={handleUpdateUser} onSignUp={() => setShowSignUp(true)} onLogin={() => setShowLogin(true)} />
        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} onSuccess={handleAuthSuccess} onSwitchToLogin={() => { setShowSignUp(false); setShowLogin(true); }} />}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleAuthSuccess} onSwitchToSignUp={() => { setShowLogin(false); setShowSignUp(true); }} />}
        
        <main className="flex-grow flex flex-col items-center justify-center p-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl">
            <div className="absolute top-0 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 text-center space-y-16 max-w-5xl animate-fade-in">
            <div className="space-y-8">
               <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-[0.5em]">
                 <i className="fa-solid fa-sparkles"></i> AI-POWERED DOCUMENT STUDIO
               </div>
               <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white via-blue-100 to-blue-400">
                 {t('hero_title_1')}<br/>{t('hero_title_2')}
               </h1>
               <p className="text-xl md:text-2xl text-blue-200/40 max-w-3xl mx-auto leading-relaxed font-medium">
                 {t('hero_desc')}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <button onClick={() => setShowSignUp(true)} className="w-full sm:w-auto px-16 py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-2xl font-black shadow-[0_20px_60px_-15px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group">
                {t('start_creating')}
                <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
              </button>
              <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto px-12 py-8 bg-white/5 hover:bg-white/10 text-white/80 rounded-[2rem] text-xl font-bold border border-white/10 backdrop-blur-md transition-all">
                {t('login')}
              </button>
            </div>
            
            <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-30">
               <div className="flex flex-col items-center gap-2"><i className="fa-solid fa-passport text-3xl"></i><span className="text-[10px] font-black uppercase tracking-widest">Global Sizes</span></div>
               <div className="flex flex-col items-center gap-2"><i className="fa-solid fa-shirt text-3xl"></i><span className="text-[10px] font-black uppercase tracking-widest">AI Outfits</span></div>
               <div className="flex flex-col items-center gap-2"><i className="fa-solid fa-wand-magic-sparkles text-3xl"></i><span className="text-[10px] font-black uppercase tracking-widest">HD Enhance</span></div>
               <div className="flex flex-col items-center gap-2"><i className="fa-solid fa-file-pdf text-3xl"></i><span className="text-[10px] font-black uppercase tracking-widest">Print Ready</span></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userHasActiveSub = isSubscriptionValid(user);

  return (
    <div className="min-h-screen flex flex-col bg-[#000000]">
      <Header onHome={resetToHome} user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
      
      <main className="flex-grow container mx-auto px-6 py-12">
        {step === 'home' && (
          <div className="space-y-20 animate-fade-in">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.8em] animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                LIVE STUDIO ENVIRONMENT
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                Studio <span className="text-blue-600">Workspace</span>
              </h1>
              {userHasActiveSub && (
                <div className="bg-blue-600/10 border border-blue-500/20 px-8 py-4 rounded-[2rem] inline-flex items-center gap-4 backdrop-blur-md">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                  <span className="text-sm font-black text-blue-400 uppercase tracking-widest">
                    Subscription active • {user.subscription?.remainingUses} Uses remaining
                  </span>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <div className="glass-card rounded-[3.5rem] p-12 border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fa-solid fa-layer-group text-9xl"></i></div>
                <div className="relative z-10 space-y-10">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-3">{t('standard_grids')}</h2>
                    <p className="text-blue-500/60 font-black uppercase text-[11px] tracking-[0.3em]">{t('standard_desc')}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {activePricing.map((p) => (
                      <button key={p.amount} onClick={() => selectPlan(p.amount)} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-600/10 transition-all text-left relative active:scale-95 btn-glow">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{p.label}</p>
                          <p className="text-4xl font-black text-white">{currencySymbol}{p.amount}</p>
                          <div className="h-px w-full bg-white/10"></div>
                          <p className="text-xs font-bold text-white/40">{p.photos} Photos per sheet</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[3.5rem] p-12 border-indigo-500/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fa-solid fa-crown text-9xl text-indigo-500"></i></div>
                <div className="relative z-10 space-y-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-black text-white mb-3">{t('bulk_savings')}</h2>
                      <p className="text-indigo-400/60 font-black uppercase text-[11px] tracking-[0.3em]">{t('bulk_desc')}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {activeBulk.map((p) => (
                      <button key={p.amount} onClick={() => selectPlan(p.amount)} className="group p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 hover:border-indigo-500/50 hover:bg-indigo-600/10 transition-all text-left relative active:scale-95 btn-glow">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{p.label}</p>
                            {p.isGold && <i className="fa-solid fa-star text-amber-500 text-[10px]"></i>}
                          </div>
                          <p className="text-4xl font-black text-white">{currencySymbol}{p.amount}</p>
                          <div className="h-px w-full bg-indigo-500/10"></div>
                          <p className="text-xs font-bold text-indigo-400/40">{p.uses} Uses • {p.validity}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <input id="main-upload" type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
          </div>
        )}

        {step === 'editor' && userPhoto && (
          <PhotoEditor 
            image={userPhoto} 
            config={config}
            photoCount={currentPhotoCount}
            onConfigChange={setConfig}
            onComplete={(final) => { setEditedPhoto(final); setStep('review'); }}
          />
        )}

        {step === 'review' && editedPhoto && (
          <LayoutReview 
            image={editedPhoto} 
            config={config} 
            photoCount={currentPhotoCount} 
            onProceed={() => setStep('payment')}
            onBack={() => setStep('editor')}
          />
        )}

        {step === 'payment' && (
          <div className="max-w-4xl mx-auto space-y-12">
            <PaymentVerification 
              amount={selectedAmount} 
              isUnlocked={isUnlocked || userHasActiveSub} 
              onVerified={handleVerificationSuccess} 
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
            />

            {(isUnlocked || userHasActiveSub) && (
              <div className="glass-card p-12 md:p-16 rounded-[4rem] space-y-16 animate-fade-in shadow-[0_0_100px_rgba(37,99,235,0.1)]">
                <div className="text-center space-y-4">
                  <h3 className="text-5xl font-black text-white tracking-tighter">{t('select_quality')}</h3>
                  <p className="text-blue-500/60 text-[12px] font-black uppercase tracking-[0.5em]">{t('quality_desc')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(Object.entries(QUALITY_BENEFITS) as [keyof typeof QUALITY_BENEFITS, typeof QUALITY_BENEFITS.Standard][]).map(([q, info]) => (
                    <button 
                      key={q} 
                      onClick={() => setDownloadQuality(q)} 
                      className={`group relative p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-6 ${
                        downloadQuality === q 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-3xl shadow-blue-600/30' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${downloadQuality === q ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                          <i className={`fa-solid ${info.icon} text-2xl`}></i>
                        </div>
                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg border ${downloadQuality === q ? 'bg-white/20 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}>
                          {info.dpi} DPI
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className={`text-xl font-black uppercase tracking-tighter ${downloadQuality === q ? 'text-white' : 'text-white/60'}`}>{q}</p>
                        <p className={`text-[11px] font-bold leading-relaxed ${downloadQuality === q ? 'text-white/70' : 'text-white/20'}`}>{info.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <button 
                    disabled={isRendering || hasDownloaded}
                    onClick={() => handleDownload('PNG')}
                    className={`flex-1 py-10 rounded-[2.5rem] font-black text-2xl flex flex-col items-center gap-3 transition-all group ${hasDownloaded ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl shadow-blue-600/30 active:scale-95'}`}
                  >
                    <i className="fa-solid fa-file-image text-3xl group-hover:scale-110 transition-transform"></i>
                    <div className="text-center">
                      <span className="text-sm uppercase tracking-widest">{hasDownloaded ? 'Exported' : t('download_png')}</span>
                    </div>
                  </button>
                  
                  <button 
                    disabled={isRendering || hasDownloaded}
                    onClick={() => handleDownload('PDF')}
                    className={`flex-1 py-10 rounded-[2.5rem] font-black text-2xl flex flex-col items-center gap-3 transition-all group ${hasDownloaded ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-3xl shadow-indigo-600/30 active:scale-95'}`}
                  >
                    <i className="fa-solid fa-file-pdf text-3xl group-hover:scale-110 transition-transform"></i>
                    <div className="text-center">
                      <span className="text-sm uppercase tracking-widest">{hasDownloaded ? 'Exported' : t('download_pdf')}</span>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col items-center gap-8 pt-10 border-t border-white/5">
                   <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.8em]">TECHNICAL SUPPORT</p>
                   <a href={`https://wa.me/91${COMPLAINT_WHATSAPP}`} target="_blank" className="flex items-center gap-5 px-10 py-5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group">
                    <i className="fa-brands fa-whatsapp text-emerald-500 text-2xl group-hover:scale-125 transition-transform"></i>
                    <span className="text-sm font-black text-white/70 uppercase tracking-widest">Chat with Assistant</span>
                   </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-white/5 bg-[#000000]">
        <div className="container mx-auto px-6 text-center space-y-10">
          <div className="flex items-center justify-center gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
               <i className="fa-solid fa-passport text-white/20 text-xl"></i>
             </div>
             <span className="text-2xl font-black tracking-tighter text-white/20">Orgeta</span>
          </div>
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
            &copy; 2025 ORGETA STUDIO • POWERED BY GEMINI AI • MADE FOR THE WORLD
          </p>
          <div className="flex justify-center gap-10 opacity-10">
            <i className="fa-brands fa-cc-visa text-3xl"></i>
            <i className="fa-brands fa-cc-mastercard text-3xl"></i>
            <i className="fa-brands fa-google-pay text-4xl"></i>
            <i className="fa-brands fa-apple-pay text-4xl"></i>
          </div>
        </div>
      </footer>

      {isRendering && (
        <div className="fixed inset-0 z-[1001] bg-[#000000]/95 backdrop-blur-2xl flex flex-col items-center justify-center">
          <div className="relative mb-10">
            <div className="w-32 h-32 border-4 border-blue-600/10 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-file-export text-blue-500 text-3xl animate-pulse"></i>
            </div>
          </div>
          <div className="text-center space-y-4">
            <p className="text-4xl font-black text-white uppercase tracking-tighter">{t('generating_hd')}</p>
            <p className="text-blue-500 text-[10px] font-black tracking-[0.6em] animate-pulse">{t('encoding_data')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <TranslationProvider>
    <AppContent />
  </TranslationProvider>
);

export default App;
