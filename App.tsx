
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
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

const AppContent: React.FC = () => {
  const { t, language } = useTranslation();
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
  
  const settingsRef = useRef<HTMLDivElement>(null);

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

  // Check if subscription is valid
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
    
    // Final check for validity
    if (!isSubscriptionValid(user)) {
      alert("Your plan has expired or no uses are left. Please activate a new plan.");
      return;
    }

    setIsRendering(true);
    
    try {
      const canvases = await generateGridCanvases(downloadQuality);
      const fileName = `Orgeta_${currentPhotoCount}Photos_${config.size.replace(/\s+/g, '_')}`;
      if (format === 'PNG') {
        canvases.forEach((canvas, index) => {
          const link = document.createElement('a');
          link.download = canvases.length > 1 ? `${fileName}_Page${index + 1}.png` : `${fileName}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
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
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height);
        });
        pdf.save(`${fileName}.pdf`);
      }
      
      // Update uses
      if (user && user.subscription) {
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            remainingUses: user.subscription.remainingUses - 1
          }
        };
        handleUpdateUser(updatedUser);
        
        // Update user ledger
        const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
        const updatedLedger = userLedger.map((u: User) => u.email === user.email ? updatedUser : u);
        localStorage.setItem('bp_user_ledger', JSON.stringify(updatedLedger));
      }
      
      setHasDownloaded(true);
    } catch (err) {
      console.error(err);
      alert("Export failed. Please try a lower quality.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleVerificationSuccess = (sub: Subscription) => {
    if (user) {
      const updatedUser = { ...user, subscription: sub };
      handleUpdateUser(updatedUser);
      
      // Update ledger
      const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
      const updatedLedger = userLedger.map((u: User) => u.email === user.email ? updatedUser : u);
      localStorage.setItem('bp_user_ledger', JSON.stringify(updatedLedger));
      
      setIsUnlocked(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#020617] text-white">
        <Header onHome={() => {}} user={null} onLogout={() => {}} onUpdateUser={handleUpdateUser} onSignUp={() => setShowSignUp(true)} onLogin={() => setShowLogin(true)} />
        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} onSuccess={handleAuthSuccess} onSwitchToLogin={() => { setShowSignUp(false); setShowLogin(true); }} />}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleAuthSuccess} onSwitchToSignUp={() => { setShowLogin(false); setShowSignUp(true); }} />}
        
        <main className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

          <div className="relative z-10 text-center space-y-12 max-w-4xl animate-in zoom-in-95 duration-700">
            <div className="space-y-6">
               <div className="text-blue-600 font-black text-sm uppercase tracking-[0.3em] animate-pulse mb-2">
                 WELCOME TO STUDIO
               </div>
               <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                 <i className="fa-solid fa-shield-check"></i> AI-Verified Studio
               </div>
               <div className="text-2xl font-black text-blue-600 uppercase tracking-tighter mb-2">Orgeta</div>
               <h1 className="text-6xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-blue-50 to-blue-200 leading-tight tracking-tighter">
                 <span className="text-4xl md:text-6xl">{t('hero_title_1')} {t('hero_title_2')}</span>
               </h1>
               <p className="text-xl md:text-2xl text-blue-200/50 max-w-2xl mx-auto leading-relaxed">
                 Join 50,000+ users creating official-standard passport photos in seconds with Orgeta. Sign up now to unlock the studio.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button onClick={() => setShowSignUp(true)} className="w-full sm:w-auto px-16 py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-2xl font-black shadow-3xl shadow-blue-600/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                <i className="fa-solid fa-user-plus"></i> {t('sign_up')} to Start
              </button>
              <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto px-12 py-8 bg-white/5 hover:bg-white/10 text-blue-400 rounded-full text-xl font-bold border border-blue-500/20 transition-all">
                {t('login')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userHasActiveSub = isSubscriptionValid(user);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onHome={resetToHome} user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {step === 'home' && (
          <div className="space-y-16 py-12 animate-in fade-in duration-700">
            <div className="text-center space-y-6">
              <div className="text-blue-600 font-black text-sm uppercase tracking-[0.3em] animate-pulse">
                WELCOME TO STUDIO
              </div>
              <div className="text-2xl font-black text-blue-600 uppercase tracking-tighter">Orgeta</div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
                <span className="text-white">{t('hero_title_1')}</span> <span className="text-blue-500">{t('hero_title_2')}</span>
              </h1>
              <p className="text-blue-300/60 text-lg max-w-2xl mx-auto font-medium">
                {t('hero_desc')}
              </p>
              {userHasActiveSub && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-3xl inline-flex items-center gap-3">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                    Active Plan: {user.subscription?.remainingUses} Uses Left until {new Date(user.subscription?.expiresAt || '').toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-card rounded-[3rem] p-10 border border-blue-500/20 shadow-2xl space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{t('standard_grids')}</h2>
                  <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">{t('standard_desc')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activePricing.map((p) => (
                    <button key={p.amount} onClick={() => selectPlan(p.amount)} className="group p-6 rounded-[2rem] bg-blue-950/40 border border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-600/10 transition-all text-left relative overflow-hidden">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{p.label}</p>
                          <p className="text-3xl font-black text-white">{currencySymbol}{p.amount}</p>
                          <p className="text-xs font-bold text-blue-300/60 mt-1">{p.photos} Photos</p>
                        </div>
                        <p className="mt-4 text-[9px] font-bold text-blue-200/40 leading-relaxed uppercase tracking-wider">{p.description}</p>
                      </div>
                      <i className="fa-solid fa-bolt-lightning absolute bottom-4 right-4 text-2xl text-blue-500/10 group-hover:text-blue-500/30 transition-colors"></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-[3rem] p-10 border border-amber-500/20 shadow-2xl space-y-8 bg-gradient-to-br from-amber-500/5 to-transparent">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">{t('bulk_savings')}</h2>
                    <p className="text-amber-500 font-bold uppercase text-[10px] tracking-widest">{t('bulk_desc')}</p>
                  </div>
                  <span className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">{t('best_choice')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activeBulk.map((p) => (
                    <button key={p.amount} onClick={() => selectPlan(p.amount)} className="group p-6 rounded-[2rem] bg-amber-950/20 border border-amber-500/10 hover:border-amber-500/40 hover:bg-amber-600/10 transition-all text-left relative overflow-hidden">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{p.label}</p>
                          <p className="text-3xl font-black text-white">{currencySymbol}{p.amount}</p>
                          <p className="text-xs font-bold text-amber-300/60 mt-1">{p.uses} Uses • {p.validity}</p>
                        </div>
                        <p className="mt-4 text-[9px] font-bold text-amber-200/40 leading-relaxed uppercase tracking-wider">{p.description}</p>
                      </div>
                      <i className={`fa-solid ${p.icon} absolute bottom-4 right-4 text-2xl text-amber-500/10 group-hover:text-amber-500/30 transition-colors`}></i>
                    </button>
                  ))}
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
          <div className="max-w-2xl mx-auto space-y-8">
            <PaymentVerification 
              amount={selectedAmount} 
              isUnlocked={isUnlocked || userHasActiveSub} 
              onVerified={handleVerificationSuccess} 
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
            />

            {(isUnlocked || userHasActiveSub) && (
              <div className="glass-card p-8 md:p-12 rounded-[3rem] border border-emerald-500/20 shadow-2xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{t('select_quality')}</h3>
                  <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.4em]">{t('quality_desc')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.entries(QUALITY_BENEFITS) as [keyof typeof QUALITY_BENEFITS, typeof QUALITY_BENEFITS.Standard][]).map(([q, info]) => (
                    <button 
                      key={q} 
                      onClick={() => setDownloadQuality(q)} 
                      className={`group relative p-6 rounded-3xl border transition-all text-left flex flex-col gap-4 ${
                        downloadQuality === q 
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-600/20' 
                        : 'bg-emerald-950/20 border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${downloadQuality === q ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          <i className={`fa-solid ${info.icon} text-lg`}></i>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${downloadQuality === q ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {info.dpi} DPI
                        </span>
                      </div>
                      
                      <div>
                        <p className={`text-sm font-black uppercase tracking-widest ${downloadQuality === q ? 'text-white' : 'text-emerald-300'}`}>{q}</p>
                        <p className={`text-[10px] font-bold mt-1 leading-tight ${downloadQuality === q ? 'text-white/70' : 'text-emerald-500/60'}`}>{info.desc}</p>
                      </div>

                      <div className={`mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${downloadQuality === q ? 'text-white/90' : 'text-emerald-400/70'}`}>
                        <i className="fa-solid fa-circle-check"></i>
                        {info.use}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    disabled={isRendering || hasDownloaded}
                    onClick={() => handleDownload('PNG')}
                    className={`flex-1 py-8 rounded-[2rem] font-black text-xl flex flex-col items-center gap-2 transition-all group ${hasDownloaded ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl shadow-blue-600/30 active:scale-95'}`}
                  >
                    <i className="fa-solid fa-file-image text-2xl group-hover:rotate-12 transition-transform"></i>
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest">{hasDownloaded ? 'Download Used' : t('download_png')}</span>
                      <span className="text-[9px] font-bold opacity-60">High-Resolution Image</span>
                    </div>
                  </button>
                  
                  <button 
                    disabled={isRendering || hasDownloaded}
                    onClick={() => handleDownload('PDF')}
                    className={`flex-1 py-8 rounded-[2rem] font-black text-xl flex flex-col items-center gap-2 transition-all group ${hasDownloaded ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-3xl shadow-emerald-600/30 active:scale-95'}`}
                  >
                    <i className="fa-solid fa-file-pdf text-2xl group-hover:scale-110 transition-transform"></i>
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest">{hasDownloaded ? 'Download Used' : t('download_pdf')}</span>
                      <span className="text-[9px] font-bold opacity-60">Best for Printing</span>
                    </div>
                  </button>
                </div>

                {hasDownloaded && (
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-center animate-in zoom-in-95">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      <i className="fa-solid fa-circle-info mr-2"></i>
                      Only one format is allowed per use. Return home to create a new one.
                    </p>
                  </div>
                )}

                <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                   <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.4em]">Help & Support</p>
                   <a href={`https://wa.me/91${COMPLAINT_WHATSAPP}`} target="_blank" className="flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group">
                    <i className="fa-brands fa-whatsapp text-emerald-500 text-xl group-hover:scale-125 transition-transform"></i>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Chat with Assistant</span>
                   </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-blue-900/40 bg-blue-950/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.4em] mb-4">
            {t('footer_copy')}
          </p>
          <div className="flex justify-center gap-8">
            <i className="fa-brands fa-cc-visa text-xl text-blue-500/20"></i>
            <i className="fa-brands fa-cc-mastercard text-xl text-blue-500/20"></i>
            <i className="fa-brands fa-google-pay text-2xl text-blue-500/20"></i>
          </div>
        </div>
      </footer>

      {isRendering && (
        <div className="fixed inset-0 z-[300] bg-blue-950/90 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-passport text-blue-500 text-xl animate-pulse"></i>
            </div>
          </div>
          <div className="mt-8 text-center space-y-2">
            <p className="text-2xl font-black text-white uppercase tracking-tighter">{t('generating_hd')}</p>
            <p className="text-blue-400 text-xs font-bold tracking-widest">{t('encoding_data')}</p>
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
