
import React, { useState } from 'react';
import Header from './components/Header';
import PhotoEditor from './components/PhotoEditor';
import LayoutReview from './components/LayoutReview';
import PaymentVerification from './components/PaymentVerification';
import { PhotoSize, PaperLayout, PhotoConfig } from './types';
import { PRICING, BULK_PLANS, PAPER_DIMENSIONS, PHOTO_DIMENSIONS } from './constants';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [step, setStep] = useState<'home' | 'editor' | 'review' | 'payment'>('home');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [editedPhoto, setEditedPhoto] = useState<string | null>(null);
  const [config, setConfig] = useState<PhotoConfig>({
    size: PhotoSize.INDIA_PASSPORT,
    layout: PaperLayout.A4
  });
  const [selectedAmount, setSelectedAmount] = useState<number>(37);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [downloadQuality, setDownloadQuality] = useState<'Standard' | 'High' | 'Maximum'>('Maximum');
  const [isRendering, setIsRendering] = useState(false);

  const resetToHome = () => {
    setStep('home');
    setUserPhoto(null);
    setEditedPhoto(null);
    setIsUnlocked(false);
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

  const currentPhotoCount = PRICING.find(p => p.amount === selectedAmount)?.photos || 21;

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
    setIsRendering(true);
    try {
      const canvases = await generateGridCanvases(downloadQuality);
      const fileName = `BluePrint_${currentPhotoCount}Photos_${config.size.replace(/\s+/g, '_')}`;
      
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
          if (index > 0) {
            pdf.addPage([paper.width, paper.height], paper.width > paper.height ? 'l' : 'p');
          }
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height);
        });
        pdf.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("Export failed. Please try a lower quality.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white">
      <Header onHome={resetToHome} />
      
      {isRendering && (
        <div className="fixed inset-0 z-[100] bg-blue-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 border-8 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-2xl shadow-blue-500/20"></div>
           <div className="mt-8 text-center space-y-2">
             <p className="text-3xl font-black text-white tracking-tighter uppercase">GENERATING HD LAYOUT</p>
             <p className="text-blue-400 font-bold uppercase tracking-widest text-xs animate-pulse">Encoding high-density multi-page data...</p>
           </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl relative">
        {step !== 'home' && (
          <div className="mb-10 flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-6 p-4 rounded-3xl bg-blue-900/10 border border-blue-500/10 shadow-inner">
               <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Studio Session</span>
                  <span className="text-sm font-bold text-white">₹{selectedAmount} • {currentPhotoCount} Photos Layout</span>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 shadow-lg border border-blue-500/30">
                  <i className="fa-solid fa-gem text-xl"></i>
               </div>
            </div>

            <button 
              onClick={resetToHome}
              className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 text-blue-400 font-black text-xs uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
            >
              <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
              Back to Plans
            </button>
          </div>
        )}

        {step === 'home' && (
          <div className="space-y-32 py-20">
            <section className="text-center space-y-12 max-w-4xl mx-auto">
              <div className="space-y-8">
                <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-blue-50 leading-[1.1] tracking-tight">
                  Professional <br /> Passports in 60s
                </h1>
                <p className="text-xl md:text-2xl text-blue-200/60 max-w-2xl mx-auto leading-relaxed">
                  The most advanced AI studio for official passport photos. Perfect cropping, auto-retouching, and print-ready grids.
                </p>
              </div>

              <div className="relative inline-block group">
                <input id="main-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <button className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-2xl font-black shadow-3xl shadow-blue-600/40 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 group-hover:ring-4 ring-blue-500/20">
                  <i className="fa-solid fa-camera-retro"></i>
                  Start Creating
                </button>
              </div>
            </section>

            {/* STANDARD PLANS SECTION */}
            <section className="space-y-16">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Standard Grids</h2>
                <p className="text-blue-300/50">One-time professional layouts for single documents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {PRICING.map(plan => (
                  <div key={plan.amount} className={`relative p-8 rounded-[2.5rem] bg-blue-900/10 border transition-all hover:-translate-y-2 group flex flex-col ${plan.label === 'Value' ? 'border-blue-400 shadow-2xl shadow-blue-900/20' : 'border-blue-500/10'}`}>
                    {plan.label === 'Value' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Best Choice</div>}
                    <div className="mb-8">
                      <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4">{plan.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">₹{plan.amount}</span>
                        <span className="text-blue-200/40 text-sm">/ print</span>
                      </div>
                    </div>
                    <div className="space-y-6 flex-grow mb-10 text-sm text-blue-100/80">
                      <div className="flex items-center gap-3 font-bold text-white text-lg">
                        <i className="fa-solid fa-images text-blue-50"></i> {plan.photos} Photos Grid
                      </div>
                      <ul className="space-y-4">
                        {['Official Size Verification', 'Premium AI Retouch', 'PNG & PDF Formats'].map(i => (
                          <li key={i} className="flex gap-3 items-center opacity-70"><i className="fa-solid fa-check text-blue-500 text-[10px]"></i> {i}</li>
                        ))}
                        {plan.label.includes('Premium') && plan.amount !== 49 && (
                          <li className="text-emerald-400 font-black text-[10px] uppercase tracking-tighter leading-tight bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                            Save 30 to 40 years from A4 photos.save PDF or PNG
                          </li>
                        )}
                      </ul>
                    </div>
                    <button onClick={() => selectPlan(plan.amount)} className={`w-full py-5 rounded-2xl font-black transition-all text-sm uppercase tracking-widest ${plan.label === 'Value' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800'}`}>Choose {plan.label}</button>
                  </div>
                ))}
              </div>
            </section>

            {/* PREMIUM BULK PLANS SECTION */}
            <section className="space-y-16">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-400">Bulk Savings & Subscriptions</h2>
                <p className="text-blue-300/50">Maximize your savings with our professional multi-use packages.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {BULK_PLANS.map(plan => {
                  const savings = plan.originalPrice - plan.amount;
                  return (
                    <div key={plan.label} className={`relative p-8 rounded-[2.5rem] transition-all hover:-translate-y-2 group flex flex-col ${plan.isGold ? 'bg-gradient-to-b from-amber-500/20 to-amber-900/10 border-amber-500/40 shadow-2xl shadow-amber-900/20' : 'bg-blue-900/10 border-blue-500/20 hover:border-blue-400/40'}`}>
                      <div className="absolute -top-4 right-8 px-4 py-1.5 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">
                        Save ₹{savings}
                      </div>
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <i className={`fa-solid ${plan.icon} ${plan.isGold ? 'text-amber-400' : 'text-blue-400'} text-xl`}></i>
                          <p className={`font-black uppercase tracking-widest text-xs ${plan.isGold ? 'text-amber-400' : 'text-blue-400'}`}>{plan.label}</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black">₹{plan.amount}</span>
                          <span className="text-blue-200/40 text-sm line-through decoration-rose-500/50">₹{plan.originalPrice}</span>
                        </div>
                        <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mt-2">
                          Valid for {plan.validity}
                        </p>
                      </div>
                      <div className="space-y-6 flex-grow mb-10">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-3">
                          <p className="text-sm font-bold text-white leading-tight">{plan.description}</p>
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter leading-tight">
                              Save 30 to 40 years from A4 photos.save PDF or PNG
                            </p>
                          </div>
                          <p className="text-[9px] text-blue-300/50 leading-relaxed font-bold uppercase tracking-widest">Universal Studio Access</p>
                        </div>
                        <ul className="space-y-3 text-[11px] font-medium text-blue-100/60">
                          <li className="flex gap-2 items-center"><i className="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i> Priority Processing</li>
                          <li className="flex gap-2 items-center"><i className="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i> Unlimited Retakes</li>
                          <li className="flex gap-2 items-center"><i className="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i> Multi-device Sync</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => selectPlan(plan.amount)} 
                        className={`w-full py-5 rounded-2xl font-black transition-all text-sm uppercase tracking-widest ${plan.isGold ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-900/40' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                        Activate Plan
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {step === 'editor' && userPhoto && (
          <PhotoEditor 
            image={userPhoto} 
            config={config} 
            photoCount={currentPhotoCount}
            onConfigChange={setConfig} 
            onComplete={img => { setEditedPhoto(img); setStep('review'); }} 
          />
        )}

        {step === 'review' && editedPhoto && (
          <LayoutReview image={editedPhoto} config={config} photoCount={currentPhotoCount} onProceed={() => setStep('payment')} onBack={() => setStep('editor')} />
        )}

        {step === 'payment' && (
          <div className="max-w-2xl mx-auto py-10">
            <PaymentVerification 
              onVerified={() => setIsUnlocked(true)} 
              isUnlocked={isUnlocked}
            />
            {isUnlocked && (
              <div className="mt-12 space-y-10 animate-in slide-in-from-bottom-8 duration-700 ease-out">
                <div className="glass-card p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-white">Select Export Quality</h3>
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Recommended for best print results</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['Standard', 'High', 'Maximum'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setDownloadQuality(q)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          downloadQuality === q 
                            ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' 
                            : 'bg-blue-950/40 border-blue-500/10 hover:border-blue-500/30'
                        }`}
                      >
                        <span className={`text-sm font-black uppercase tracking-tighter ${downloadQuality === q ? 'text-white' : 'text-blue-300'}`}>
                          {q}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${downloadQuality === q ? 'text-blue-100' : 'text-blue-500'}`}>
                          {q === 'Maximum' ? '300 DPI' : q === 'High' ? '150 DPI' : '72 DPI'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => handleDownload('PNG')} 
                    disabled={isRendering}
                    className="group relative py-6 bg-white text-blue-950 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-50 transition-all shadow-3xl active:scale-95 overflow-hidden disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-image text-2xl text-blue-600"></i>
                      <span>DOWNLOAD PNG</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-950/40 uppercase tracking-widest">Lossless Digital Format</span>
                  </button>
                  
                  <button 
                    onClick={() => handleDownload('PDF')} 
                    disabled={isRendering}
                    className="group relative py-6 bg-emerald-600 text-white rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-500 transition-all shadow-3xl active:scale-95 overflow-hidden disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-file-pdf text-2xl"></i>
                      <span>DOWNLOAD PDF</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Direct PDF Document</span>
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">
                    <i className="fa-solid fa-circle-check mr-2"></i> 
                    High Quality Access Unlocked
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-16 border-t border-blue-900/30 text-center space-y-4">
        <p className="text-blue-500/50 text-xs font-bold uppercase tracking-[0.3em]">&copy; 2025 BluePrint Studio • India's Leading Passport AI</p>
        <p className="text-blue-500/30 text-[10px]">Trusted for Official Document Applications Worldwide</p>
      </footer>
    </div>
  );
};

export default App;
