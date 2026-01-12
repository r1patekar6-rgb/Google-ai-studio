import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { PhotoSize, PaperLayout, PhotoConfig } from '../types';
import { PHOTO_DIMENSIONS, PAPER_DIMENSIONS } from '../constants';
import { editUserPhoto } from '../services/geminiService';
import { useTranslation } from './TranslationContext';

interface PhotoEditorProps {
  image: string;
  config: PhotoConfig;
  photoCount: number;
  onConfigChange: (config: PhotoConfig) => void;
  onComplete: (finalImage: string) => void;
}

interface HistoryEntry {
  image: string;
  isCropped: boolean;
}

const CLOTHING_CATEGORIES = {
  Suits: [
    "Classic Black Professional Suit", "Dark Navy Blue Executive Suit", "Charcoal Grey Tailored Suit", 
    "Light Grey Modern Suit", "Royal Blue Business Suit", "Dark Brown Classic Suit", 
    "Beige Summer Professional Suit", "Forest Green Designer Suit", "Maroon Luxury Suit", 
    "Silver Grey Silk Suit", "Olive Green Modern Suit", "Deep Purple Elegant Suit", 
    "Tan Formal Executive Suit", "Black Sharp Pinstripe Suit", "Navy Blue Bold Pinstripe Suit"
  ],
  Blazers: [
    "Navy Blue Single-Breasted Blazer", "Professional Black Slim-Fit Blazer", "Slate Grey Casual Blazer", 
    "Camel Brown Suede Blazer", "Burgundy Velvet Blazer", "Crisp Pure White Blazer", 
    "Olive Drab Field Blazer", "Sky Blue Summer Blazer", "Crimson Red Statement Blazer", 
    "Mustard Yellow Modern Blazer", "Emerald Green Classic Blazer", "Lavender Pastel Blazer", 
    "Cream Silk Blazer", "Teal Textured Blazer", "Rust Orange Vintage Blazer"
  ],
  Shirts: [
    "Crisp White Oxford Dress Shirt", "Light Blue Professional Cotton Shirt", "Formal White Wingtip Shirt", 
    "Midnight Black Silk Shirt", "Slate Grey Modern Dress Shirt", "Pastel Pink Executive Shirt", 
    "Royal Blue Slim-Fit Formal Shirt", "Lavender Professional Work Shirt", "Charcoal Textured Dress Shirt", 
    "Burgundy Formal Evening Shirt", "Forest Green Classic Shirt", "Midnight Navy Dress Shirt", 
    "Cream Silk Executive Shirt", "Sky Blue Micro-Check Formal Shirt", "Light Grey Minimalist Shirt"
  ],
  "Ties": [
    "White Dress Shirt with Classic Red Silk Tie", "White Dress Shirt with Navy Blue Striped Tie", 
    "Light Blue Professional Shirt with Charcoal Tie", "White Shirt with Slim Black Modern Tie", 
    "Professional White Shirt with Burgundy Red Tie", "White Shirt with Navy and Silver Polka Dot Tie", 
    "Formal White Shirt with Emerald Green Silk Tie", "Sky Blue Shirt with Yellow and Blue Patterned Tie"
  ],
  "Bow Ties": [
    "Classic Black Bow Tie with White Tuxedo Shirt", "Maroon Velvet Bow Tie with Crisp White Shirt", 
    "Navy Blue Formal Bow Tie with White Business Shirt", "Silver Silk Bow Tie with White Formal Shirt", 
    "Dark Grey Modern Bow Tie with Sky Blue Shirt", "Forest Green Satin Bow Tie with Cream Shirt",
    "Gold Patterned Bow Tie with White Wingtip Shirt"
  ],
  Backgrounds: [
    { name: "Pure White", color: "#FFFFFF" },
    { name: "Light Blue", color: "#ADD8E6" },
    { name: "Royal Blue", color: "#002366" },
    { name: "Slate Grey", color: "#708090" },
    { name: "Studio Grey", color: "#E0E0E0" },
    { name: "Cream White", color: "#FFFDD0" },
    { name: "Passport Blue", color: "#0055A4" },
    { name: "Dark Blue", color: "#00008B" },
    { name: "Soft Pink", color: "#FFB6C1" },
    { name: "Mint Green", color: "#98FF98" }
  ]
};

const PhotoEditor: React.FC<PhotoEditorProps> = ({ image, config, photoCount, onConfigChange, onComplete }) => {
  const { t } = useTranslation();
  const [isCropping, setIsCropping] = useState(true);
  const [baseImage, setBaseImage] = useState(image);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'clothes'>('clothes');
  const [clothSubTab, setClothSubTab] = useState<keyof typeof CLOTHING_CATEGORIES>('Suits');
  const [selectedBgColor, setSelectedBgColor] = useState('#FFFFFF');
  
  const [enhanceSettings, setEnhanceSettings] = useState({
    sharpness: 50,
    brightness: 50,
    contrast: 50
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const previewRef = useRef<HTMLDivElement>(null);

  const photoDim = PHOTO_DIMENSIONS[config.size];
  const aspect = photoDim.width / photoDim.height;

  const addToHistory = (newImg: string, isResult: boolean) => {
    const newEntry: HistoryEntry = { image: newImg, isCropped: isResult };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    if (isResult) {
      setCroppedImage(newImg);
      setIsCropping(false);
    } else {
      setBaseImage(newImg);
      setIsCropping(true);
    }
  };

  const handleAiEdit = async (action: 'enhance' | 'remove_bg' | 'apply_clothes' | 'change_bg_color', item?: string) => {
    setIsProcessing(true);
    try {
      const sourceImage = croppedImage || baseImage;
      const result = await editUserPhoto(
        sourceImage, 
        action, 
        item, 
        action === 'enhance' ? enhanceSettings : undefined
      );
      addToHistory(result, true);
    } catch (err) {
      alert("AI Studio error. Ensure your face is clearly visible and centered.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropSave = async () => {
    if (croppedAreaPixels) {
      const cropped = await getCroppedImg(baseImage, croppedAreaPixels);
      if (cropped) {
        setCroppedImage(cropped);
        setIsCropping(false);
        addToHistory(cropped, true);
      }
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (err) => reject(err));
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string | null> => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/jpeg');
  };

  return (
    <div className="space-y-8 relative">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-wand-magic-sparkles text-blue-500 text-2xl animate-pulse"></i>
            </div>
          </div>
          <div className="mt-8 text-center px-4 space-y-3">
            <p className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{t('ai_working')}</p>
            <p className="text-blue-400 text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">{t('ai_applying')}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-6">
          <div className="flex items-center justify-between bg-blue-900/10 p-4 rounded-3xl border border-blue-500/10 shadow-sm">
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-white tracking-tight">
                {isCropping ? t('crop_portrait') : t('editing_suite')}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => historyIndex > 0 && addToHistory(history[historyIndex-1].image, history[historyIndex-1].isCropped)} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${historyIndex > 0 ? 'bg-blue-600/40 text-blue-200 hover:bg-blue-600' : 'bg-blue-900/10 text-blue-800 cursor-not-allowed'}`}
                title="Undo"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
              {!isCropping && (
                <button onClick={() => setIsCropping(true)} className="px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                  {t('re_crop')}
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-square md:aspect-[4/3] w-full rounded-[3rem] overflow-hidden bg-slate-900 border-2 border-blue-500/20 shadow-2xl flex items-center justify-center">
            {isCropping ? (
              <Cropper image={baseImage} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onCropComplete={(_, p) => setCroppedAreaPixels(p)} onZoomChange={setZoom} />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 bg-grid-white/[0.02]">
                <img src={croppedImage!} alt="Edited" className="max-h-full rounded-2xl shadow-2xl border-4 border-white transition-all duration-1000 ease-out animate-in zoom-in-95" />
              </div>
            )}
          </div>

          <button onClick={isCropping ? handleCropSave : () => onComplete(croppedImage!)} className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-[0.98] ${isCropping ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'} text-white`}>
            {isCropping ? t('confirm_start') : t('finish_preview')}
          </button>
        </div>

        <div className="w-full lg:w-[450px] flex flex-col gap-4">
          <div className="glass-card rounded-[3.5rem] flex flex-col min-h-[650px] border border-blue-500/20 shadow-2xl overflow-hidden">
            <div className="flex p-3 bg-blue-950/40 gap-2">
              <button onClick={() => setActiveTab('clothes')} className={`flex-1 py-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'clothes' ? 'bg-blue-600 text-white shadow-xl' : 'text-blue-400 hover:text-blue-100'}`}>Style Studio</button>
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-xl' : 'text-blue-400 hover:text-blue-100'}`}>{t('ai_tools')}</button>
            </div>

            <div className="p-8 flex-grow overflow-y-auto no-scrollbar space-y-8">
              {activeTab === 'ai' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6 p-7 bg-blue-900/10 rounded-[2.5rem] border border-blue-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl"><i className="fa-solid fa-wand-magic-sparkles text-xl"></i></div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('photo_enhance')}</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sharpness</label>
                          <span className="text-[10px] font-black text-white bg-blue-900/40 px-2 py-0.5 rounded-md">{enhanceSettings.sharpness}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={enhanceSettings.sharpness} onChange={(e) => setEnhanceSettings({...enhanceSettings, sharpness: parseInt(e.target.value)})} className="w-full accent-blue-500 bg-blue-950 rounded-lg h-1.5 appearance-none cursor-pointer" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Brightness</label>
                          <span className="text-[10px] font-black text-white bg-blue-900/40 px-2 py-0.5 rounded-md">{enhanceSettings.brightness}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={enhanceSettings.brightness} onChange={(e) => setEnhanceSettings({...enhanceSettings, brightness: parseInt(e.target.value)})} className="w-full accent-blue-500 bg-blue-950 rounded-lg h-1.5 appearance-none cursor-pointer" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Contrast</label>
                          <span className="text-[10px] font-black text-white bg-blue-900/40 px-2 py-0.5 rounded-md">{enhanceSettings.contrast}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={enhanceSettings.contrast} onChange={(e) => setEnhanceSettings({...enhanceSettings, contrast: parseInt(e.target.value)})} className="w-full accent-blue-500 bg-blue-950 rounded-lg h-1.5 appearance-none cursor-pointer" />
                      </div>
                    </div>

                    <button onClick={() => handleAiEdit('enhance')} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl transition-all active:scale-[0.98] border border-blue-400/20">
                      Apply Enhancement
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => handleAiEdit('remove_bg')} className="p-6 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-5 hover:bg-emerald-500/20 transition-all text-left group">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-user-check text-2xl"></i></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('remove_bg')}</span>
                        <span className="text-xs font-bold text-white opacity-60">Clean Studio White</span>
                      </div>
                    </button>
                  </div>

                  {/* Photo Standard Selection */}
                  <div className="pt-8 border-t border-blue-500/10 space-y-6">
                    <h4 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em]">{t('output_standard')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(PhotoSize).map(s => (
                        <button key={s} onClick={() => onConfigChange({...config, size: s})} className={`px-4 py-4 rounded-2xl text-[10px] font-black tracking-widest border transition-all ${config.size === s ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-blue-900/10 text-blue-400 border-blue-500/10 hover:border-blue-500/40'}`}>{s.split(' (')[0].toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  {/* Paper Layout Selection */}
                  <div className="pt-8 border-t border-blue-500/10 space-y-6">
                    <h4 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em]">{t('paper_layout')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(PaperLayout).map(l => (
                        <button key={l} onClick={() => onConfigChange({...config, layout: l})} className={`px-4 py-4 rounded-2xl text-[10px] font-black tracking-widest border transition-all ${config.layout === l ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-blue-900/10 text-blue-400 border-blue-500/10 hover:border-blue-500/40'}`}>{l.split(' (')[0].toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-wrap gap-1.5 bg-blue-950/40 p-2 rounded-[2rem] border border-blue-500/10 shadow-inner">
                    {Object.keys(CLOTHING_CATEGORIES).map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setClothSubTab(cat as any)} 
                        className={`flex-1 py-3 px-1 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${clothSubTab === cat ? 'bg-blue-600 text-white shadow-lg scale-[1.05]' : 'text-blue-500 hover:text-blue-100 hover:bg-blue-600/10'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {clothSubTab === 'Backgrounds' ? (
                    <div className="space-y-8 animate-in zoom-in-95 duration-400">
                      <div className="grid grid-cols-2 gap-4">
                        {(CLOTHING_CATEGORIES.Backgrounds as any[]).map((bg, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => handleAiEdit('change_bg_color', bg.name)}
                            className="group flex flex-col gap-3 p-4 rounded-[2.5rem] bg-blue-950/40 border border-blue-500/10 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all text-left ring-offset-4 ring-offset-[#020617] ring-blue-500/50 hover:ring-2"
                          >
                            <div className="w-full h-20 rounded-[1.8rem] shadow-inner border border-white/5 group-hover:scale-[0.98] transition-transform" style={{ backgroundColor: bg.color }}></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest truncate text-center">{bg.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-7 bg-blue-900/10 rounded-[3rem] border border-blue-500/10 space-y-6">
                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3">
                          <i className="fa-solid fa-palette text-blue-400"></i> Custom Studio Color
                        </h4>
                        <div className="flex items-center gap-5 bg-blue-950/60 p-6 rounded-[1.8rem] border border-blue-500/10 group cursor-pointer hover:bg-blue-950 transition-colors">
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
                            <input 
                              type="color" 
                              value={selectedBgColor} 
                              onBlur={(e) => handleAiEdit('change_bg_color', e.target.value)}
                              onChange={(e) => setSelectedBgColor(e.target.value)} 
                              className="absolute -inset-6 w-32 h-32 cursor-pointer bg-transparent border-none appearance-none"
                            />
                          </div>
                          <div className="flex flex-col flex-grow">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Select Hue</span>
                            <span className="text-xl font-black text-white uppercase tracking-tighter tabular-nums">{selectedBgColor}</span>
                          </div>
                          <i className="fa-solid fa-chevron-right text-blue-500/30 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                        </div>
                        <p className="text-[9px] text-blue-500/40 font-black text-center uppercase tracking-[0.3em]">Selection applies instantly</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 animate-in zoom-in-95 duration-400">
                      {(CLOTHING_CATEGORIES[clothSubTab as keyof typeof CLOTHING_CATEGORIES] as string[]).map((item, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => handleAiEdit('apply_clothes', item)} 
                          className="group w-full p-6 rounded-[2rem] bg-blue-950/40 border border-blue-500/10 text-left transition-all hover:bg-blue-600/20 hover:border-blue-500/40 active:scale-[0.98] ring-offset-4 ring-offset-[#020617] ring-blue-500/50 hover:ring-2 flex items-center justify-between"
                        >
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest opacity-80">{clothSubTab.slice(0, -1)} Selection</span>
                            <span className="text-sm font-black text-white tracking-tight group-hover:text-blue-100 transition-colors">{item}</span>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl border border-blue-500/10">
                              <i className="fa-solid fa-plus text-sm"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] font-black text-blue-500/30 uppercase tracking-[0.5em] text-center mb-4">Orgeta Studio AI Engine</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;