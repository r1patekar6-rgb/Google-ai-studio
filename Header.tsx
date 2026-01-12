import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from './components/TranslationContext';
import { COMPLAINT_WHATSAPP } from './constants';
import { User } from './types';
import ProfileModal from './components/ProfileModal';

interface Language {
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { name: 'English (US)', flag: '🇺🇸' },
  { name: 'English (UK)', flag: '🇬🇧' },
  { name: 'Marathi', flag: '🇮🇳' },
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'Telugu', flag: '🇮🇳' },
  { name: 'Tamil', flag: '🇮🇳' },
  { name: 'Kannada', flag: '🇮🇳' },
  { name: 'Malayalam', flag: '🇮🇳' },
  { name: 'Gujarati', flag: '🇮🇳' },
  { name: 'Bengali', flag: '🇮🇳' },
  { name: 'Punjabi', flag: '🇮🇳' },
  { name: 'Assamese', flag: '🇮🇳' },
  { name: 'Odia', flag: '🇮🇳' },
  { name: 'Nepali', flag: '🇳🇵' },
  { name: 'Arabic', flag: '🇸🇦' },
  { name: 'French (France)', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Spanish (Spain)', flag: '🇪🇸' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'Korean', flag: '🇰🇷' },
  { name: 'Russian', flag: '🇷🇺' },
  { name: 'Portuguese', flag: '🇧🇷' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Dutch', flag: '🇳🇱' },
  { name: 'Turkish', flag: '🇹🇷' },
  { name: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Thai', flag: '🇹🇭' },
  { name: 'Simplified Chinese', flag: '🇨🇳' },
  { name: 'Konkani', flag: '🇮🇳' },
  { name: 'Chhattisgarhi', flag: '🇮🇳' },
  { name: 'Sanskrit', flag: '🇮🇳' },
  { name: 'Santhali', flag: '🇮🇳' },
  { name: 'Meitei (Manipuri)', flag: '🇮🇳' },
  { name: 'Khasi', flag: '🇮🇳' },
  { name: 'Mizo', flag: '🇮🇳' }
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
      title: 'Orgeta - Passport AI Studio',
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
    const msg = encodeURIComponent("Hi Orgeta Support, I have a complaint regarding my session.");
    window.open(`https://wa.me/91${COMPLAINT_WHATSAPP}?text=${msg}`, '_blank');
    setShowSettings(false);
  };

  const handleFeedback = () => {
    const msg = encodeURIComponent("Hi Orgeta Team, I'd like to provide some feedback about the app.");
    window.open(`https://wa.me/91${COMPLAINT_WHATSAPP}?text=${msg}`, '_blank');
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-blue-900/40 transition-colors duration-500">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative" ref={languageRef}>
            <button 
              onClick={() => {
                setShowLanguages(!showLanguages);
                setLangSearchQuery('');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-2xl transition-all"
            >
              <span className="text-lg leading-none">{selectedLanguage.flag}</span>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-blue-400">
                {selectedLanguage.name.split(' (')[0]}
              </span>
              <i className={`fa-solid fa-chevron-down text-[8px] text-blue-500/50 transition-transform ${showLanguages ? 'rotate-180' : ''}`}></i>
            </button>
            
            {showLanguages && (
              <div className="absolute left-0 mt-3 w-72 rounded-[2rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-blue-500/10">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/30 text-[10px]"></i>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder={t('search_lang')}
                      value={langSearchQuery}
                      onChange={(e) => setLangSearchQuery(e.target.value)}
                      className="w-full bg-blue-900/20 border border-blue-500/20 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => (
                      <button 
                        key={lang.name}
                        onClick={() => { setLanguage(lang); setShowLanguages(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                          selectedLanguage.name === lang.name 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'hover:bg-blue-600/10 text-blue-50/70'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <p className="text-xs font-bold uppercase tracking-tight">{lang.name}</p>
                        {selectedLanguage.name === lang.name && (
                          <i className="fa-solid fa-check ml-auto text-[10px]"></i>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest">No results found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div onClick={onHome} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 bg-[#000080] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-passport text-white text-xl"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]">
              Orgeta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => { onHome(); setShowSettings(false); }}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-blue-400/20 shadow-blue-600/20"
              >
                <i className="fa-solid fa-bolt"></i>
                Top Up
              </button>

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
                className={`w-10 h-10 flex items-center justify-center rounded-xl bg-blue-900/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-500 transition-all ${showSettings ? 'bg-blue-600/20' : ''}`}
              >
                <i className={`fa-solid fa-gear text-lg transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`}></i>
              </button>

              {showSettings && (
                <div ref={settingsRef} className="absolute right-0 top-14 w-64 rounded-[2rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    <button onClick={() => { onHome(); setShowSettings(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-600/20 text-left transition-colors text-blue-400 group">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><i className="fa-solid fa-bolt"></i></div>
                      <span className="text-sm font-black uppercase tracking-tighter">Top Up Credits</span>
                    </button>
                    <button onClick={() => { setShowProfile(true); setShowSettings(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-600/20 text-left transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-user"></i></div>
                      <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">My Profile</span>
                    </button>
                    <div className="h-px bg-blue-500/10 my-1"></div>
                    <button onClick={handleShare} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-600/20 text-left transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-share-nodes"></i></div>
                      <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">Share Website</span>
                    </button>
                    <button onClick={handleComplaint} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-600/20 text-left transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400"><i className="fa-brands fa-whatsapp text-lg"></i></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">Complaint</span>
                        <span className="text-[8px] font-bold text-rose-500 uppercase">MSG ONLY: 9823818455</span>
                      </div>
                    </button>
                    <button onClick={handleFeedback} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-emerald-600/20 text-left transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fa-solid fa-comment-dots"></i></div>
                      <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">Feedback</span>
                    </button>
                    <div className="h-px bg-blue-500/10 my-1"></div>
                    <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-600/20 text-left transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400"><i className="fa-solid fa-right-from-bracket"></i></div>
                      <span className="text-sm font-black text-blue-50 uppercase tracking-tighter">{t('logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
               <button onClick={onLogin} className="hidden sm:block text-xs font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors">
                {t('login')}
              </button>
               <button onClick={onSignUp} className="text-xs font-black uppercase tracking-widest px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg transition-all active:scale-95 border border-blue-400/20 shadow-blue-600/20">
                {t('sign_up')}
              </button>
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