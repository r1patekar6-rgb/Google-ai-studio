
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { COMPLAINT_WHATSAPP, REPORT_EMAIL } from '../constants';

interface Country {
  code: string;
  name: string;
  lang: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', lang: 'English / Hindi', flag: '🇮🇳' },
  { code: 'US', name: 'USA', lang: 'English', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', lang: 'English', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', lang: 'English / French', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', lang: 'English', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', lang: 'Arabic / English', flag: '🇦🇪' },
  { code: 'AF', name: 'Afghanistan', lang: 'Pashto / Dari', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', lang: 'Shqip', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', lang: 'Arabic', flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina', lang: 'Español', flag: '🇦🇷' },
  { code: 'AT', name: 'Austria', lang: 'Deutsch', flag: '🇦🇹' },
  { code: 'BD', name: 'Bangladesh', lang: 'Bengali', flag: '🇧🇩' },
  { code: 'BE', name: 'Belgium', lang: 'Dutch / French', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', lang: 'Português', flag: '🇧🇷' },
  { code: 'CH', name: 'Switzerland', lang: 'German / French', flag: '🇨🇭' },
  { code: 'CL', name: 'Chile', lang: 'Español', flag: '🇨🇱' },
  { code: 'CN', name: 'China', lang: 'Mandarin', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', lang: 'Español', flag: '🇨🇴' },
  { code: 'DE', name: 'Germany', lang: 'Deutsch', flag: '🇩🇪' },
  { code: 'DK', name: 'Denmark', lang: 'Dansk', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', lang: 'Arabic', flag: '🇪🇬' },
  { code: 'ES', name: 'Spain', lang: 'Español', flag: '🇪🇸' },
  { code: 'FI', name: 'Finland', lang: 'Suomi', flag: '🇫🇮' },
  { code: 'FR', name: 'France', lang: 'Français', flag: '🇫🇷' },
  { code: 'GR', name: 'Greece', lang: 'Greek', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', lang: 'Cantonese / English', flag: '🇭🇰' },
  { code: 'ID', name: 'Indonesia', lang: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', lang: 'English / Irish', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', lang: 'Hebrew / Arabic', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', lang: 'Italiano', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', lang: '日本語', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', lang: 'Swahili / English', flag: '🇰🇪' },
  { code: 'KR', name: 'South Korea', lang: '한국어', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', lang: 'Arabic', flag: '🇰🇼' },
  { code: 'LK', name: 'Sri Lanka', lang: 'Sinhala / Tamil', flag: '🇱🇰' },
  { code: 'MX', name: 'Mexico', lang: 'Español', flag: '🇲🇽' },
  { code: 'MY', name: 'Malaysia', lang: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'NG', name: 'Nigeria', lang: 'English', flag: '🇳🇬' },
  { code: 'NL', name: 'Netherlands', lang: 'Nederlands', flag: '🇳🇱' },
  { code: 'NO', name: 'Norway', lang: 'Norsk', flag: '🇳🇴' },
  { code: 'NZ', name: 'New Zealand', lang: 'English', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', lang: 'Arabic', flag: '🇴🇲' },
  { code: 'PH', name: 'Philippines', lang: 'Filipino / English', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', lang: 'Urdu / English', flag: '🇵🇰' },
  { code: 'PL', name: 'Poland', lang: 'Polski', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', lang: 'Português', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', lang: 'Arabic', flag: '🇶🇦' },
  { code: 'RU', name: 'Russia', lang: 'Русский', flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', lang: 'Arabic', flag: '🇸🇦' },
  { code: 'SE', name: 'Sweden', lang: 'Svenska', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', lang: 'English / Mandarin', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', lang: 'Thai', flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey', lang: 'Türkçe', flag: '🇹🇷' },
  { code: 'UA', name: 'Ukraine', lang: 'Ukrainian', flag: '🇺🇦' },
  { code: 'VN', name: 'Vietnam', lang: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ZA', name: 'South Africa', lang: 'English / Afrikaans', flag: '🇿🇦' },
];

interface HeaderProps {
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lang.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setShowCountries(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: 'BluePrint - Passport Photo Maker',
      text: 'Create professional passport photos in 60 seconds with AI!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
    setShowSettings(false);
  };

  const handleFeedback = () => {
    window.location.href = `mailto:${REPORT_EMAIL}?subject=Feedback regarding BluePrint App`;
    setShowSettings(false);
  };

  const handleComplaint = () => {
    const message = encodeURIComponent("Hello BluePrint Support, I'd like to raise a concern.");
    window.open(`https://wa.me/91${COMPLAINT_WHATSAPP}?text=${message}`, '_blank');
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-blue-900/40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <div 
          onClick={onHome} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 blue-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-passport text-white text-xl"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter text-blue-50">
            BLUE<span className="text-blue-500">PRINT</span>
          </span>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <button onClick={onHome} className="text-sm font-medium text-blue-200/60 hover:text-blue-400 transition-colors">
            Pricing
          </button>
          <a href="#" className="text-sm font-medium text-blue-200/60 hover:text-blue-400 transition-colors">
            How it works
          </a>
          <a href="#" className="text-sm font-medium text-blue-200/60 hover:text-blue-400 transition-colors">
            Templates
          </a>
          <a href="#" className="text-sm font-medium text-blue-200/60 hover:text-blue-400 transition-colors">
            Support
          </a>
        </nav>

        {/* Right Side: Language, Settings & Auth */}
        <div className="flex items-center gap-3">
          {/* Country Selector (Moved to Right Side) */}
          <div className="relative" ref={countryRef}>
            <button 
              onClick={() => setShowCountries(!showCountries)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-900/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-2xl transition-all group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{selectedCountry.flag}</span>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-blue-400">{selectedCountry.code}</span>
              <i className={`fa-solid fa-chevron-down text-[8px] text-blue-500 transition-transform ${showCountries ? 'rotate-180' : ''}`}></i>
            </button>

            {showCountries && (
              <div className="absolute right-0 mt-3 w-72 rounded-[2rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-blue-500/10">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-xs"></i>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-blue-900/20 border border-blue-500/20 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white placeholder:text-blue-500/50 outline-none focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button 
                        key={country.code}
                        onClick={() => { setSelectedCountry(country); setShowCountries(false); setSearchQuery(''); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${selectedCountry.code === country.code ? 'bg-blue-600/30 border border-blue-500/30' : 'hover:bg-blue-600/10 border border-transparent'}`}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{country.flag}</span>
                        <div className="text-left flex-grow">
                          <p className="text-xs font-bold text-blue-50 leading-tight">{country.name}</p>
                          <p className="text-[9px] font-medium text-blue-400/60 mt-0.5">{country.lang}</p>
                        </div>
                        {selectedCountry.code === country.code && (
                          <i className="fa-solid fa-check text-blue-400 text-xs"></i>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <i className="fa-solid fa-earth-americas text-3xl text-blue-900 mb-3 block"></i>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">No results found</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-blue-900/10 border-t border-blue-500/10">
                  <p className="text-[8px] font-bold text-blue-500/50 text-center uppercase tracking-widest">
                    Supporting 150+ Regions Globally
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 bg-blue-900/20 hover:bg-blue-600/30 text-blue-400 rounded-full flex items-center justify-center transition-all border border-blue-500/20 shadow-inner"
            >
              <i className={`fa-solid fa-gear text-lg transition-transform duration-500 ${showSettings ? 'rotate-90' : ''}`}></i>
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-3 w-56 rounded-[1.5rem] bg-blue-950/95 backdrop-blur-xl border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  <button 
                    onClick={handleShare}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-600/20 text-blue-100 transition-colors rounded-2xl group"
                  >
                    <i className="fa-solid fa-share-nodes text-blue-500 group-hover:scale-110 transition-transform"></i>
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Share App</span>
                  </button>
                  <button 
                    onClick={handleFeedback}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-600/20 text-blue-100 transition-colors rounded-2xl group"
                  >
                    <i className="fa-solid fa-comment-dots text-blue-500 group-hover:scale-110 transition-transform"></i>
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Feedback</span>
                  </button>
                  <div className="h-[1px] bg-blue-500/10 mx-4 my-2"></div>
                  <button 
                    onClick={handleComplaint}
                    className="w-full flex flex-col gap-1 px-5 py-4 hover:bg-rose-600/10 text-rose-400 transition-colors rounded-2xl group"
                  >
                    <div className="flex items-center gap-4">
                      <i className="fa-brands fa-whatsapp text-xl text-emerald-500 group-hover:scale-110 transition-transform"></i>
                      <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Raise Complaint</span>
                    </div>
                    <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-tighter pl-9">Message Only: {COMPLAINT_WHATSAPP}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button className="hidden sm:block text-sm font-bold px-5 py-2 hover:bg-blue-500/10 rounded-full transition-colors text-blue-200">
            Login
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
            <i className="fa-solid fa-crown text-[10px]"></i>
            Get Pro
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
