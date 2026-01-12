
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from './TranslationContext';
import { COMPLAINT_WHATSAPP } from '../constants';
import { User } from '../types';
import ProfileModal from './ProfileModal';

interface Language {
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { name: 'Telugu', flag: '🇮🇳' },
  { name: 'English (US)', flag: '🇺🇸' },
  { name: 'English (UK)', flag: '🇬🇧' },
  { name: 'Assamese', flag: '🇮🇳' },
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'Chhattisgarhi', flag: '🇮🇳' },
  { name: 'Konkani', flag: '🇮🇳' },
  { name: 'Gujarati', flag: '🇮🇳' },
  { name: 'Punjabi', flag: '🇮🇳' },
  { name: 'Sanskrit', flag: '🇮🇳' },
  { name: 'Santhali', flag: '🇮🇳' },
  { name: 'Kannada', flag: '🇮🇳' },
  { name: 'Malayalam', flag: '🇮🇳' },
  { name: 'Marathi', flag: '🇮🇳' },
  { name: 'Meitei (Manipuri)', flag: '🇮🇳' },
  { name: 'Khasi', flag: '🇮🇳' },
  { name: 'Mizo', flag: '🇮🇳' },
  { name: 'Odia', flag: '🇮🇳' },
  { name: 'Nepali', flag: '🇳🇵' },
  { name: 'Tamil', flag: '🇮🇳' },
  { name: 'Bengali', flag: '🇮🇳' },
  { name: 'Arabic', flag: '🇸🇦' },
  { name: 'French (France)', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Spanish (Spain)', flag: '🇪🇸' },
  { name: 'Japanese', flag: '🇮🇳' },
  { name: 'Korean', flag: '🇰🇷' },
  { name: 'Russian', flag: '🇷🇺' },
  { name: 'Simplified Chinese', flag: '🇨🇳' },
  { name: 'Portuguese', flag: '🇧🇷' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Dutch', flag: '🇳🇱' },
  { name: 'Turkish', flag: '🇹🇷' },
  { name: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Thai', flag: '🇹🇭' }
];

interface HeaderProps {
  onHome: () => void;
  user: User | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onSignUp?: () => void;
  onLogin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome, user, onLogout, onUpdateUser, onSignUp, onLogin }) => {
  const { language: selectedLanguage, setLanguage, t } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  
  const languageRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(langSearchQuery.toLowerCase())
    );
  }, [langSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguages(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: 'BluePrint - Passport AI Studio',
      text: 'Create professional passport photos in 60 seconds with AI!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) { console.error(err); }
    setShowSettings(false);
  };

  const handleComplaint = () => {
    window.open(`https://wa.me/91${COMPLAINT_WHATSAPP}`, '_blank');
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-blue-900/40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative" ref={languageRef}>
            <button 
              onClick={() => setShowLanguages(!showLanguages)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-900/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-2xl transition-all"
            >
              <i className="fa-solid fa-language text-blue-400 text-lg"></i>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-blue-400">{selectedLanguage.name.split(' (')[0]}</span>
            </button>
            {showLanguages && (
              <div className="absolute left-0 mt-3 w-72 rounded-[2rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-blue-500/10">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder={t('search_lang')}
                    value={langSearchQuery}
                    onChange={(e) => setLangSearchQuery(e.target.value)}
                    className="w-full bg-blue-900/20 border border-blue-500/20 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {filteredLanguages.map((lang) => (
                    <button 
                      key={lang.name}
                      onClick={() => { setLanguage(lang); setShowLanguages(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${selectedLanguage.name === lang.name ? 'bg-blue-600/30' : 'hover:bg-blue-600/10'}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <p className="text-xs font-bold text-blue-50">{lang.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div onClick={onHome} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 blue-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-passport text-white text-xl"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter text-blue-50">
              BLUE<span className="text-blue-500">PRINT</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
              >
                 <div className="w-8 h-8 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-[12px] font-black text-white border border-blue-400/30 shadow-lg">
                   {user.profileImage ? (
                     <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     user.name.charAt(0).toUpperCase()
                   )}
                 </div>
                 <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-0.5">{t('welcome')}</span>
                    <span className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                 </div>
              </button>
              
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-900/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 transition-all"
              >
                <i className={`fa-solid fa-gear text-lg ${showSettings ? 'rotate-90' : ''}`}></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
               <button onClick={onLogin} className="hidden sm:block text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors">
                {t('login')}
              </button>
               <button onClick={onSignUp} className="text-xs font-black uppercase tracking-widest px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg transition-all">
                {t('sign_up')}
              </button>
            </div>
          )}

          {showSettings && (
            <div className="absolute right-4 top-20 w-64 rounded-[2rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 space-y-1">
                <button onClick={() => { setShowProfile(true); setShowSettings(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-600/20 text-left transition-colors sm:hidden">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-user"></i></div>
                  <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">My Profile</span>
                </button>
                <button onClick={handleShare} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-600/20 text-left transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-share-nodes"></i></div>
                  <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">Share Website</span>
                </button>
                <button onClick={handleComplaint} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-emerald-600/20 text-left transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fa-brands fa-whatsapp text-lg"></i></div>
                  <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">Support</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-600/20 text-left transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400"><i className="fa-solid fa-right-from-bracket"></i></div>
                  <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProfile && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onUpdate={(updated) => {
            onUpdateUser(updated);
            setShowProfile(false);
          }} 
        />
      )}
    </header>
  );
};

export default Header;
