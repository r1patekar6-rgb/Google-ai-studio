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
    "Black Professional Suit", "Navy Blue Suit", "Charcoal Grey Suit", "Light Grey Suit", 
    "Royal Blue Suit", "Dark Brown Suit", "Beige Summer Suit", "Forest Green Suit", 
    "Maroon Professional Suit", "Silver Grey Suit", "Olive Green Suit", "Deep Purple Suit", 
    "Tan Formal Suit", "Black Pinstripe Suit", "Navy Pinstripe Suit"
  ],
  Blazers: [
    "Classic Navy Blazer", "Professional Black Blazer", "Slate Grey Blazer", "Camel Brown Blazer", 
    "Burgundy Blazer", "Pure White Blazer", "Olive Drab Blazer", "Sky Blue Blazer", 
    "Crimson Red Blazer", "Mustard Yellow Blazer", "Emerald Green Blazer", "Lavender Blazer", 
    "Cream Blazer", "Teal Blazer", "Rust Orange Blazer"
  ],
  Shirts: [
    "Classic White Oxford Shirt", "Light Blue Formal Shirt", "Crisp White Wingtip Shirt", 
    "Professional Navy Blue Shirt", "Slate Grey Dress Shirt", "Pastel Pink Business Shirt", 
    "Royal Blue Slim Fit Shirt", "Lavender Professional Shirt", "Charcoal Modern Shirt", 
    "Burgundy Formal Shirt", "Forest Green Dress Shirt", "Midnight Black Formal Shirt", 
    "Cream Silk Executive Shirt", "Sky Blue Micro-check Shirt", "Light Grey Textured Shirt"
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
  
  // Enhancement states
  const [enhanceSettings, setEnhanceSettings] = useState({
    sharpness: 50,
    brightness: 50,
    contrast: 50
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridScale, setGridScale] = useState(1);

  const photoDim = PHOTO_DIMENSIONS[config.size];
  const paperDim = PAPER_DIMENSIONS[config.layout];
  const aspect = photoDim.width / photoDim.height;

  const padding = 10;
  const gap = 2;
  const effectiveWidth = paperDim.width - (padding * 2);
  const cols = Math.floor((effectiveWidth + gap) / (photoDim.width + gap));

  const autoScaleGrid = useCallback(() => {
    if (gridContainerRef.current) {
      const parent = gridContainerRef.current.parentElement;
      if (parent) {
        const pWidth = parent.clientWidth - 48;
        const pHeight = parent.clientHeight - 48;
        const scaleW = pWidth / paperDim.width;
        const scaleH = pHeight / paperDim.height;
        setGridScale(Math.min(scaleW, scaleH, 1));
      }
    }
  }, [paperDim.width, paperDim.height]);

  useEffect(() => {
    if (viewMode === 'grid') {
      autoScaleGrid();
      window.addEventListener('resize', autoScaleGrid);
      return () => window.removeEventListener('resize', autoScaleGrid);
    }
  }, [viewMode, autoScaleGrid]);

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
      const sourceImage = isCropping ? baseImage : (croppedImage || baseImage);
      const result = await editUserPhoto(
        sourceImage, 
        action, 
        item, 
        action === 'enhance' ? enhanceSettings : undefined
      );
      addToHistory(result, !isCropping);
    } catch (err) {
      alert("AI Processing error. Please try a clearer photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropSave = async () => {
    if (croppedAreaPixels) {
      const cropped = await getCroppedImg(baseImage, croppedAreaPixels);
      if (cropped) addToHistory(cropped, true);
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
        <div className="fixed inset-0 z-[100] bg-blue-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-wand-magic-sparkles text-blue-400 text-xl animate-pulse"></i>
            </div>
          </div>
          <div className="mt-8 text-center px-4">
            <p className="text-2xl font-black text-white uppercase tracking-tighter">{t('ai_working')}</p>
            <p className="text-blue-300 text-xs font-bold tracking-[0.2em] uppercase mt-2">{t('ai_applying')}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-6">
          <div className="flex items-center justify-between bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white">
                {isCropping ? t('crop_portrait') : t('editing_suite')}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => historyIndex > 0 && addToHistory(history[historyIndex-1].image, history[historyIndex-1].isCropped)} 
                className={`p-2 rounded-lg transition-colors ${historyIndex > 0 ? 'bg-blue-600/40 text-blue-200' : 'bg-blue-900/10 text-blue-800 cursor-not-allowed'}`}
                title="Undo"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
              {!isCropping && (
                <button onClick={() => setIsCropping(true)} className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold border border-blue-500/20 hover:bg-blue-500/20">
                  {t('re_crop')}
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-square md:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-blue-500/20 shadow-2xl flex items-center justify-center">
            {isCropping ? (
              <Cropper image={baseImage} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onCropComplete={(_, p) => setCroppedAreaPixels(p)} onZoomChange={setZoom} />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 bg-grid-slate-900/[0.04]">
                <img src={croppedImage!} alt="Edited" className="max-h-full rounded-lg shadow-2xl border-8 border-white transition-all duration-500" />
              </div>
            )}
          </div>

          <button onClick={isCropping ? handleCropSave : () => onComplete(croppedImage!)} className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all ${isCropping ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>
            {isCropping ? t('confirm_start') : t('finish_preview')}
          </button>
        </div>

        <div className="w-full lg:w-[420px] flex flex-col gap-4">
          <div className="glass-card rounded-[2.5rem] flex flex-col min-h-[600px] border border-blue-500/20 shadow-2xl overflow-hidden">
            <div className="flex p-2 bg-blue-950/40 gap-1">
              <button onClick={() => setActiveTab('clothes')} className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase transition-all ${activeTab === 'clothes' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400'}`}>Style Studio</button>
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400'}`}>{t('ai_tools')}</button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto no-scrollbar space-y-8">
              {activeTab === 'ai' ? (
                <div className="space-y-6">
                  <div className="space-y-6 p-4 bg-blue-900/10 rounded-3xl border border-blue-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('photo_enhance')}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-blue-500 uppercase">Sharpness</label>
                          <span className="text-[10px] font-bold text-white">{enhanceSettings.sharpness}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={enhanceSettings.sharpness}
                          onChange={(e) => setEnhanceSettings({...enhanceSettings, sharpness: parseInt(e.target.value)})}
                          className="w-full accent-blue-500 bg-blue-900/40 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-blue-500 uppercase">Brightness</label>
                          <span className="text-[10px] font-bold text-white">{enhanceSettings.brightness}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={enhanceSettings.brightness}
                          onChange={(e) => setEnhanceSettings({...enhanceSettings, brightness: parseInt(e.target.value)})}
                          className="w-full accent-blue-500 bg-blue-900/40 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-blue-500 uppercase">Contrast</label>
                          <span className="text-[10px] font-bold text-white">{enhanceSettings.contrast}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={enhanceSettings.contrast}
                          onChange={(e) => setEnhanceSettings({...enhanceSettings, contrast: parseInt(e.target.value)})}
                          className="w-full accent-blue-500 bg-blue-900/40 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAiEdit('enhance')}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase shadow-lg transition-all active:scale-[0.98]"
                    >
                      Apply Enhancement
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => handleAiEdit('remove_bg')} className="p-4 rounded-2xl bg-blue-900/20 border border-blue-500/10 flex items-center gap-4 hover:bg-blue-900/40 transition-all text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><i className="fa-solid fa-user-check"></i></div>
                      <span className="text-xs font-bold text-white uppercase tracking-widest">{t('remove_bg')}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-blue-500/10 space-y-6">
                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest">{t('output_standard')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(PhotoSize).map(s => (
                        <button key={s} onClick={() => onConfigChange({...config, size: s})} className={`px-3 py-3 rounded-xl text-[10px] font-black border ${config.size === s ? 'bg-blue-600 text-white' : 'bg-blue-900/10 text-blue-400 border-blue-500/10'}`}>{s.split(' (')[0]}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-1 bg-blue-950/20 p-1 rounded-xl">
                    {Object.keys(CLOTHING_CATEGORIES).map((cat) => (
                      <button key={cat} onClick={() => setClothSubTab(cat as any)} className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${clothSubTab === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-500 hover:bg-blue-600/10'}`}>{cat}</button>
                    ))}
                  </div>

                  {clothSubTab === 'Backgrounds' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        {(CLOTHING_CATEGORIES.Backgrounds as any[]).map((bg, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => handleAiEdit('change_bg_color', bg.name)}
                            className="group flex flex-col gap-2 p-3 rounded-2xl bg-blue-900/10 border border-blue-500/5 hover:bg-blue-600/20 transition-all text-left ring-offset-2 ring-blue-500 hover:ring-2"
                          >
                            <div className="w-full h-12 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: bg.color }}></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{bg.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-4 bg-blue-900/10 rounded-3xl border border-blue-500/10 space-y-4">
                        <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                          <i className="fa-solid fa-palette"></i> Custom Color
                        </h4>
                        <div className="flex items-center gap-4 bg-blue-950/40 p-4 rounded-2xl border border-blue-500/10">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-white/10 flex-shrink-0">
                            <input 
                              type="color" 
                              value={selectedBgColor} 
                              onBlur={(e) => handleAiEdit('change_bg_color', e.target.value)}
                              onChange={(e) => setSelectedBgColor(e.target.value)} 
                              className="absolute -inset-2 w-16 h-16 cursor-pointer bg-transparent border-none appearance-none"
                            />
                          </div>
                          <div className="flex flex-col flex-grow">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pick Color</span>
                            <span className="text-sm font-bold text-white uppercase">{selectedBgColor}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-blue-500/60 font-bold text-center uppercase">Applies immediately when color is chosen</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {(CLOTHING_CATEGORIES[clothSubTab as keyof typeof CLOTHING_CATEGORIES] as string[]).map((item, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => handleAiEdit('apply_clothes', item)} 
                          className="group w-full p-4 rounded-2xl bg-blue-900/10 border border-blue-500/5 text-left transition-all hover:bg-blue-600/20 active:scale-[0.98] ring-offset-2 ring-blue-500 hover:ring-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-blue-500 font-black uppercase block mb-1">{clothSubTab.slice(0, -1)} #{idx + 1}</span>
                              <span className="text-sm font-bold text-white group-hover:text-blue-100">{item}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <i className="fa-solid fa-plus text-[10px]"></i>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;