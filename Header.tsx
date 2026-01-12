
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
  { name: 'Turkish', flag: '🇹