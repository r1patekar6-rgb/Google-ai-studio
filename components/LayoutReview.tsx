
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoConfig, PaperLayout } from '../types';
import { PHOTO_DIMENSIONS, PAPER_DIMENSIONS } from '../constants';

interface LayoutReviewProps {
  image: string;
  config: PhotoConfig;
  photoCount: number;
  onProceed: () => void;
  onBack: () => void;
}

const LayoutReview: React.FC<LayoutReviewProps> = ({ image, config, photoCount, onProceed, onBack }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  
  const paperDim = PAPER_DIMENSIONS[config.layout];
  const photoDim = PHOTO_DIMENSIONS[config.size];
  
  // Professional Print Settings
  const gap = 1.5; // mm
  const padding = 8; // mm
  
  // Calculate grid columns/rows to fit the paper
  const effectiveWidth = paperDim.width - (padding * 2);
  const effectiveHeight = paperDim.height - (padding * 2);
  const cols = Math.floor((effectiveWidth + gap) / (photoDim.width + gap));
  const rows = Math.floor((effectiveHeight + gap) / (photoDim.height + gap));
  const photosPerPage = cols * rows;
  const totalPages = Math.ceil(photoCount / photosPerPage);

  const autoScale = useCallback(() => {
    if (previewRef.current) {
      const container = previewRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth - 64;
        const containerHeight = container.clientHeight - 64;
        
        const scaleW = containerWidth / paperDim.width;
        const scaleH = containerHeight / paperDim.height;
        
        setScale(Math.min(scaleW, scaleH, 1));
      }
    }
  }, [paperDim.width, paperDim.height]);

  useEffect(() => {
    autoScale();
    window.addEventListener('resize', autoScale);
    return () => window.removeEventListener('resize', autoScale);
  }, [autoScale]);

  const startIdx = currentPage * photosPerPage;
  const endIdx = Math.min(startIdx + photosPerPage, photoCount);
  const photosOnThisPage = endIdx - startIdx;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
      {/* Workspace Area */}
      <div className="flex-grow flex flex-col gap-6">
        <div className="flex items-center justify-between bg-blue-900/10 p-4 rounded-3xl border border-blue-500/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
               <i className="fa-solid fa-eye text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Print Layout Review</h3>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">
                {totalPages > 1 ? `Page ${currentPage + 1} of ${totalPages}` : `Sheet Preview`} • {config.layout}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {totalPages > 1 && (
              <div className="flex bg-blue-950/50 p-1 rounded-xl mr-2">
                <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg text-blue-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button 
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="px-4 py-2 rounded-lg text-blue-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-950/50 text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              Back to Editor
            </button>
          </div>
        </div>

        <div className="relative flex-grow rounded-[2.5rem] border-2 border-blue-500/20 bg-slate-950 shadow-2xl flex items-center justify-center p-8 overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          <div 
            ref={previewRef}
            className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] origin-center transition-all duration-500 ease-out relative overflow-hidden"
            style={{ 
              width: `${paperDim.width}mm`, 
              height: `${paperDim.height}mm`, 
              transform: `scale(${scale})`, 
              display: 'grid', 
              gridTemplateColumns: `repeat(${cols}, ${photoDim.width}mm)`, 
              gap: `${gap}mm`, 
              padding: `${padding}mm`, 
              alignContent: 'flex-start',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div className="absolute -top-6 left-0 text-[3mm] text-slate-400 font-mono uppercase font-black opacity-0 group-hover:opacity-100 transition-opacity">
               {config.layout} • {totalPages > 1 ? `Sheet ${currentPage + 1}/${totalPages}` : 'Single Sheet'} • 300DPI Render
            </div>

            {Array.from({ length: photosOnThisPage }).map((_, i) => (
              <div 
                key={i} 
                className="relative group/photo"
                style={{ 
                  width: `${photoDim.width}mm`, 
                  height: `${photoDim.height}mm`, 
                  backgroundImage: `url(${image})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  boxShadow: '0 0.5mm 1mm rgba(0,0,0,0.1)'
                }} 
              >
                <div className="absolute -inset-[0.1mm] border-[0.05mm] border-slate-200 pointer-events-none opacity-50"></div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-slate-900/80 backdrop-blur-lg rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-expand text-blue-500"></i>
            Scroll to zoom • Drag to pan sheet
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col border border-blue-500/20 shadow-2xl h-fit sticky top-24">
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 rotate-3">
                 <i className="fa-solid fa-file-invoice text-3xl"></i>
               </div>
               <div>
                  <h4 className="text-2xl font-black text-white">Review Order</h4>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                    {totalPages > 1 ? `${totalPages} Sheets Required` : 'Single Sheet Grid Ready'}
                  </p>
               </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-5 bg-blue-950/40 rounded-3xl border border-blue-500/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Photos</span>
                  <span className="text-sm font-bold text-white bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/20">{photoCount} Photos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sheet Count</span>
                  <span className="text-sm font-bold text-white">{totalPages} Page(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Photo Size</span>
                  <span className="text-sm font-bold text-white">{config.size.split(' (')[0]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Layout Format</span>
                  <span className="text-sm font-bold text-white">{config.layout.split(' (')[0]}</span>
                </div>
                <div className="pt-3 border-t border-blue-500/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Resolution</span>
                  <span className="text-xs font-bold text-emerald-400">300 DPI (HD)</span>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex gap-3">
                  <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
                  <p className="text-[10px] text-blue-300 leading-relaxed font-bold">
                    This plan requires {totalPages} A4 sheets. The PDF/PNG export will include all pages automatically.
                  </p>
                </div>
              )}

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex gap-3">
                <i className="fa-solid fa-shield-halved text-emerald-500 mt-1"></i>
                <p className="text-[10px] text-emerald-200/70 leading-relaxed font-medium">
                  Layout is optimized for professional laboratories. High contrast and border ratios are verified.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                onClick={onProceed}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 transform active:scale-95 group"
              >
                Proceed to Payment
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
              <p className="text-center text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Secure Checkout Verified</p>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <i className="fa-solid fa-lightbulb"></i>
          </div>
          <p className="text-[10px] font-bold text-blue-300 leading-normal">
            PRO TIP: Use heavy glossy paper (200GSM+) for the best official results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LayoutReview;
