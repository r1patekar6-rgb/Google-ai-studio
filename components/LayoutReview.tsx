
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoConfig, PaperLayout } from '../types';
import { PHOTO_DIMENSIONS, PAPER_DIMENSIONS } from '../constants';
import { useTranslation } from './TranslationContext';

interface LayoutReviewProps {
  image: string;
  config: PhotoConfig;
  photoCount: number;
  onProceed: () => void;
  onBack: () => void;
}

const LayoutReview: React.FC<LayoutReviewProps> = ({ image, config, photoCount, onProceed, onBack }) => {
  const { t } = useTranslation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  
  const paperDim = PAPER_DIMENSIONS[config.layout];
  const photoDim = PHOTO_DIMENSIONS[config.size];
  
  const gap = 1.5; 
  const padding = 8; 
  
  const effectiveWidth = paperDim.width - (padding * 2);
  const cols = Math.floor((effectiveWidth + gap) / (photoDim.width + gap));
  const rows = Math.floor(((paperDim.height - (padding * 2)) + gap) / (photoDim.height + gap));
  const photosPerPage = cols * rows;
  const totalPages = Math.ceil(photoCount / photosPerPage);

  const autoScale = useCallback(() => {
    if (previewRef.current) {
      const container = previewRef.current.parentElement;
      if (container) {
        setScale(Math.min((container.clientWidth - 64) / paperDim.width, (container.clientHeight - 64) / paperDim.height, 1));
      }
    }
  }, [paperDim.width, paperDim.height]);

  useEffect(() => {
    autoScale();
    window.addEventListener('resize', autoScale);
    return () => window.removeEventListener('resize', autoScale);
  }, [autoScale]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
      <div className="flex-grow flex flex-col gap-6">
        <div className="flex items-center justify-between bg-blue-900/10 p-4 rounded-3xl border border-blue-500/10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-white">{t('review_title')}</h3>
          </div>
          <button onClick={onBack} className="px-6 py-3 rounded-xl bg-blue-950/50 text-blue-400 text-xs font-black uppercase">{t('back')}</button>
        </div>

        <div className="relative flex-grow rounded-[2.5rem] border-2 border-blue-500/20 bg-slate-950 shadow-2xl flex items-center justify-center p-8 overflow-hidden group">
          <div ref={previewRef} className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative" style={{ width: `${paperDim.width}mm`, height: `${paperDim.height}mm`, transform: `scale(${scale})`, display: 'grid', gridTemplateColumns: `repeat(${cols}, ${photoDim.width}mm)`, gap: `${gap}mm`, padding: `${padding}mm`, alignContent: 'flex-start', justifyContent: 'center', boxSizing: 'border-box' }}>
            {Array.from({ length: Math.min(photosPerPage, photoCount - (currentPage * photosPerPage)) }).map((_, i) => (
              <div key={i} style={{ width: `${photoDim.width}mm`, height: `${photoDim.height}mm`, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 0.5mm 1mm rgba(0,0,0,0.1)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass-card rounded-[2.5rem] p-8 border border-blue-500/20 shadow-2xl h-fit">
          <h4 className="text-2xl font-black text-white mb-8">{t('order_summary')}</h4>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-[10px] font-black text-blue-500 uppercase">{t('total_photos')}</span><span className="text-sm font-bold text-white">{photoCount}</span></div>
            <div className="flex justify-between"><span className="text-[10px] font-black text-blue-500 uppercase">{t('sheet_count')}</span><span className="text-sm font-bold text-white">{totalPages}</span></div>
            <div className="flex justify-between"><span className="text-[10px] font-black text-blue-500 uppercase">{t('photo_size')}</span><span className="text-sm font-bold text-white">{config.size.split(' (')[0]}</span></div>
            <div className="flex justify-between pt-3 border-t border-blue-500/10"><span className="text-[10px] font-black text-emerald-500 uppercase">{t('resolution')}</span><span className="text-xs font-bold text-emerald-400">300 DPI</span></div>
          </div>
          <button onClick={onProceed} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl mt-8">{t('proceed_payment')}</button>
        </div>
      </div>
    </div>
  );
};

export default LayoutReview;
