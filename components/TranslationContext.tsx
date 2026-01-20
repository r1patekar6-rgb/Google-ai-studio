import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TRANSLATIONS, TranslationKey } from '../translations';
import { GoogleGenAI, Type } from "@google/genai";

interface Language {
  name: string;
  flag: string;
}

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const DEFAULT_LANG = { name: 'Marathi', flag: '🇮🇳' };

const RTL_LANGS = ['Arabic', 'Hebrew', 'Persian', 'Urdu', 'Pashto', 'Syriac', 'Sorani Kurdish'];

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return saved ? JSON.parse(saved) : DEFAULT_LANG;
  });

  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem('dynamic_translations');
    return saved ? JSON.parse(saved) : {};
  });

  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_language', JSON.stringify(language));
    
    if (language.name !== 'English (US)' && !TRANSLATIONS[language.name] && !dynamicTranslations[language.name]) {
      translateUI(language.name);
    }

    const isRtl = RTL_LANGS.some(rl => language.name.includes(rl));
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language.name;
  }, [language]);

  const translateUI = async (targetLang: string) => {
    setIsTranslating(true);
    try {
      // Fix: Corrected GoogleGenAI initialization to use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const baseStrings = TRANSLATIONS['English (US)'] as Record<string, string>;
      
      const schemaProperties: Record<string, any> = {};
      Object.keys(baseStrings).forEach(key => {
        schemaProperties[key] = { type: Type.STRING };
      });

      const prompt = `You are an expert polyglot translator specialized in Indian regional and global languages.
      Translate the following UI strings from English to ${targetLang}.
      Rules:
      1. Provide a professional, natural-sounding translation that fits a modern tech app context.
      2. Keep all JSON keys exactly the same.
      3. Return ONLY the JSON object.
      
      JSON to translate: ${JSON.stringify(baseStrings)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: Object.keys(baseStrings)
          }
        }
      });

      // Fix: Use response.text property directly
      let responseText = response.text || '{}';
      
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      } else if (responseText.includes('```')) {
        responseText = responseText.split('```')[1].split('```')[0];
      }

      const result = JSON.parse(responseText.trim());
      const updatedDynamics = { ...dynamicTranslations, [targetLang]: result };
      setDynamicTranslations(updatedDynamics);
      localStorage.setItem('dynamic_translations', JSON.stringify(updatedDynamics));
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const t = (key: TranslationKey): string => {
    if (dynamicTranslations[language.name]?.[key]) return dynamicTranslations[language.name][key];
    const langDict = TRANSLATIONS[language.name];
    if (langDict?.[key]) return langDict[key]!;
    return TRANSLATIONS['English (US)'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {isTranslating && (
        <div className="fixed inset-0 z-[200] bg-blue-950/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-[12px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Localizing UI to {language.name}...</p>
        </div>
      )}
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within a TranslationProvider');
  return context;
};