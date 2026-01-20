import React, { useState, useRef, useEffect, useMemo } from 'react';
import Header from './Header';
import PhotoEditor from './components/PhotoEditor';
import LayoutReview from './components/LayoutReview';
import PaymentVerification from './components/PaymentVerification';
import { PhotoSize, PaperLayout, PhotoConfig, Subscription } from './types';
import { 
  INR_PRICING, USD_PRICING, 
  INR_BULK_PLANS, USD_BULK_PLANS, 
  PAPER_DIMENSIONS, PHOTO_DIMENSIONS, 
  INDIAN_LANGUAGES 
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
      <div className="flex flex-col items-center gap-10 relative z-10 animate-fade-in">
        <div className="relative">
          <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-3xl backdrop-blur-2xl border border-white/10 overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-blue-600/40 transition-colors"></div>
            <i className="fa-solid fa-passport text-white text-6xl relative z-10 drop-shadow-lg"></i>
          </div>
          <div className="absolute -inset-4 border border-blue-500/20 rounded-[3.5rem] animate-pulse"></div>
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">Orgeta</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-blue-500/40"></div>
            <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.6em] animate-pulse">AI PASSPORT STUDIO</p>
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
        @keyframes progress-premium { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        .animate-progress-premium { animation: progress-premium 2.8s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
      `}</style>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, language } = useTranslation();
  const [isSplash, setIsSplash] = useState(true);
  const [step, setStep] = useState<'home' | 'editor' | 'review' | 'payment'>('home');
  
  // Persistent Subscription State
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    try {
      const saved = localStorage.getItem('orgeta_subscription');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [editedPhoto, setEditedPhoto] = useState<string | null>(null);
  const [config, setConfig] = useState<PhotoConfig>({
    size: PhotoSize.INDIA_PASSPORT,
    layout: PaperLayout.A4
  });
  const [selectedAmount, setSelectedAmount] = useState<number>(37);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [downloadQuality, setDownloadQuality] = useState<'Standard' | 'High' | 'Maximum'>('Maximum');
  const [isRendering, setIsRendering] = useState(false);

  // Helper: Validity Check
  const isSubscriptionValid = (sub: Subscription | null): boolean => {
    if (!sub) return false;
    const now = new Date();
    const expiry = new Date(sub.expiresAt);
    return now < expiry && sub.remainingUses > 0;
  };

  // Derived state for unlocking
  const isUnlocked = useMemo(() => isSubscriptionValid(subscription), [subscription]);

  // Initial Validity Check and Background Audit
  useEffect(() => {
    checkAndSendMonthlyReport();
    checkAndSendUserReport();
    
    // Check if current subscription is expired on load
    if (subscription && !isSubscriptionValid(subscription)) {
      setSubscription(null);
      localStorage.removeItem('orgeta_subscription');
    }
  }, []);

  const handleVerificationSuccess = (sub: Subscription) => {
    setSubscription(sub);
    localStorage.setItem('orgeta_subscription', JSON.stringify(sub));
    // Immediately scroll to the download section
    setTimeout(() => {
      const el = document.getElementById('download-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDownload = async (format: 'PNG' | 'PDF') => {
    if (hasDownloaded) return;
    if (!isUnlocked) {
      alert("Verification required.");
      setStep('payment');
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
      
      // Update uses
      if (subscription) {
        const updatedSub = { ...subscription, remainingUses: subscription.remainingUses - 1 };
        setSubscription(updatedSub);
        localStorage.setItem('orgeta_subscription', JSON.stringify(updatedSub));
      }
      setHasDownloaded(true);
    } catch (err) {
      alert("Export failed.");
    } finally {
      setIsRendering(false);
    }
  };

  // Re-used helper
  const generateGridCanvases = async (quality: 'Standard' | 'High' | 'Maximum'): Promise<HTMLCanvasElement[]> => {
    const dpi = quality === 'Maximum' ? 300 : quality === 'High' ? 150 : 72;
    const paper = PAPER_DIMENSIONS[config.layout];
    const photoStandard = PHOTO_DIMENSIONS[config.size];
    const img = new Image();
    img.src = editedPhoto!;
    await new Promise((resolve) => { img.onload = resolve; });
    const imageAspectRatio = img.width / img.height;
    const photoWidthMM = photoStandard.width;
    const photoHeightMM = photoWidthMM / imageAspectRatio;
    const mmToPx = (mm: number) => (mm / 25.4) * dpi;
    const gap = mmToPx(1.5);
    const padding = mmToPx(8);
    const photoW = mmToPx(photoWidthMM);
    const photoH = mmToPx(photoHeightMM);
    const canvasW = mmToPx(paper.width);
    const canvasH = mmToPx(paper.height);
    const effectiveWidth = canvasW - (padding * 2);
    const effectiveHeight = canvasH - (padding * 2);
    const cols = Math.max(1, Math.floor((effectiveWidth + gap) / (photoW + gap)));
    const rows = Math.max(1, Math.floor((effectiveHeight + gap) / (photoH + gap)));
    const photosPerPage = cols * rows;
    const currentPhotoCount = activePricing.find(p => p.amount === selectedAmount)?.photos || activeBulk.find(p => p.amount === selectedAmount)?.amount || 21;
    const totalPages = Math.ceil(currentPhotoCount / photosPerPage);
    const canvases: HTMLCanvasElement[] = [];

    for (let p = 0; p < totalPages; p++) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext('2d'); if (!ctx) continue;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = Math.max(0.5, dpi / 600);
        ctx.strokeRect(x, y, photoW, photoH);
      }
      canvases.push(canvas);
    }
    return canvases;
  };

  const activePricing = !INDIAN_LANGUAGES.includes(language.name) ? USD_PRICING : INR_PRICING;
  const activeBulk = !INDIAN_LANGUAGES.includes(language.name) ? USD_BULK_PLANS : INR_BULK_PLANS;
  const currencySymbol = !INDIAN_LANGUAGES.includes(language.name) ? '$' : '₹';
  const currencyCode = !INDIAN_LANGUAGES.includes(language.name) ? 'USD' : 'INR';

  if (isSplash) return <SplashScreen onComplete={() => setIsSplash(false)} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#000000]">
      <Header onHome={() => setStep('home')} user={null} onLogout={() => {}} onUpdateUser={() => {}} />
      <main className="flex-grow container mx-auto px-6 py-12">
        {step === 'home' && (
          <div className="space-y-20 animate-fade-in">
            <div className="text-center space-y-8">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">Studio <span className="text-blue-600">Workspace</span></h1>
              <p className="text-blue-400/60 text-xs font-black uppercase tracking-[0.5em]">Select a plan to begin your HD export session</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="glass-card rounded-[3.5rem] p-12 border-blue-500/20">
                <h2 className="text-4xl font-black text-white mb-10">{t('standard_grids')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activePricing.map((p) => (
                    <button key={p.amount} onClick={() => { setSelectedAmount(p.amount); document.getElementById('main-upload')?.click(); }} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all text-left min-h-[180px] flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{p.label}</p>
                          <span className="text-[10px] font-black text-white/40 uppercase bg-white/5 px-2 py-1 rounded-lg">{p.photos} Photos</span>
                        </div>
                        <p className="text-4xl font-black text-white">{currencySymbol}{p.amount}</p>
                      </div>
                      <p className="text-[11px] font-medium text-blue-100/40 mt-4 leading-relaxed">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-[3.5rem] p-12 border-indigo-500/20">
                <h2 className="text-4xl font-black text-white mb-10">{t('bulk_savings')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activeBulk.map((p: any) => (
                    <button key={p.amount} onClick={() => { setSelectedAmount(p.amount); document.getElementById('main-upload')?.click(); }} className="group p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 hover:border-indigo-500/50 transition-all text-left min-h-[180px] flex flex-col justify-between relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{p.label}</p>
                          <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-lg">Save {currencySymbol}{p.originalPrice - p.amount}</span>
                        </div>
                        <p className="text-4xl font-black text-white">{currencySymbol}{p.amount}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-medium text-indigo-100/40 leading-relaxed">{p.description}</p>
                        <div className="flex gap-4">
                           <span className="text-[9px] font-black text-indigo-500/40 uppercase tracking-tighter">{p.validity}</span>
                           <span className="text-[9px] font-black text-indigo-500/40 uppercase tracking-tighter">{p.uses} Sessions</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <input id="main-upload" type="file" hidden accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => { setUserPhoto(reader.result as string); setStep('editor'); };
                reader.readAsDataURL(file);
              }
            }} />
          </div>
        )}

        {step === 'editor' && userPhoto && (
          <PhotoEditor 
            image={userPhoto} config={config} photoCount={21}
            onConfigChange={setConfig} onComplete={(final) => { setEditedPhoto(final); setStep('review'); }}
          />
        )}

        {step === 'review' && editedPhoto && (
          <LayoutReview 
            image={editedPhoto} config={config} photoCount={21}
            onProceed={() => setStep('payment')} onBack={() => setStep('editor')}
          />
        )}

        {step === 'payment' && (
          <div className="max-w-4xl mx-auto space-y-12 pb-32">
            <PaymentVerification 
              amount={selectedAmount} isUnlocked={isUnlocked} onVerified={handleVerificationSuccess} 
              currencySymbol={currencySymbol} currencyCode={currencyCode}
            />

            {isUnlocked && (
              <div id="download-section" className="glass-card p-12 md:p-16 rounded-[4rem] space-y-16 animate-fade-in shadow-[0_0_100px_rgba(37,99,235,0.1)] border-blue-400/30">
                <div className="text-center space-y-4">
                  <h3 className="text-5xl font-black text-white tracking-tighter">{t('select_quality')}</h3>
                  <p className="text-blue-500/60 text-[12px] font-black uppercase tracking-[0.5em]">{t('quality_desc')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(Object.entries(QUALITY_BENEFITS) as [keyof typeof QUALITY_BENEFITS, typeof QUALITY_BENEFITS.Standard][]).map(([q, info]) => (
                    <button key={q} onClick={() => setDownloadQuality(q)} className={`group relative p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-6 ${downloadQuality === q ? 'bg-blue-600 border-blue-400 text-white shadow-3xl scale-105' : 'bg-white/5 border-white/5 text-white/40'}`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${downloadQuality === q ? 'bg-white/20' : 'bg-white/5'}`}><i className={`fa-solid ${info.icon} text-2xl`}></i></div>
                        <span className="text-[11px] font-black">{info.dpi} DPI</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black uppercase">{q}</p>
                        <p className="text-[11px] font-bold opacity-60">{info.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col md:flex-row gap-6 pt-10">
                  <button onClick={() => handleDownload('PNG')} className={`flex-1 py-10 rounded-[2.5rem] font-black text-2xl flex flex-col items-center gap-3 transition-all ${hasDownloaded ? 'bg-white/5 text-white/10' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-3xl'}`}>
                    <i className="fa-solid fa-file-image text-3xl"></i>
                    <span className="text-sm uppercase">{hasDownloaded ? 'Exported' : t('download_png')}</span>
                  </button>
                  <button onClick={() => handleDownload('PDF')} className={`flex-1 py-10 rounded-[2.5rem] font-black text-2xl flex flex-col items-center gap-3 transition-all ${hasDownloaded ? 'bg-white/5 text-white/10' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-3xl'}`}>
                    <i className="fa-solid fa-file-pdf text-3xl"></i>
                    <span className="text-sm uppercase">{hasDownloaded ? 'Exported' : t('download_pdf')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {isRendering && (
        <div className="fixed inset-0 z-[1001] bg-[#000000]/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in">
          <div className="w-32 h-32 border-4 border-blue-600/10 border-t-blue-500 rounded-full animate-spin mb-10"></div>
          <p className="text-4xl font-black text-white uppercase tracking-tighter">{t('generating_hd')}</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (<TranslationProvider><AppContent /></TranslationProvider>);
export default App;