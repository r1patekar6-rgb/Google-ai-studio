
import React from 'react';

export const INDIAN_LANGUAGES = [
  'Telugu', 'Assamese', 'Hindi', 'Chhattisgarhi', 'Konkani', 'Gujarati', 
  'Punjabi', 'Sanskrit', 'Santhali', 'Kannada', 'Malayalam', 'Marathi', 
  'Meitei (Manipuri)', 'Khasi', 'Mizo', 'Odia', 'Tamil', 'Bengali'
];

export const INR_PRICING = [
  { 
    amount: 37, 
    photos: 21, 
    label: 'Standard', 
    validityDays: 1, 
    uses: 1, 
    description: 'Professional 300 DPI grid for single documents. Perfect for basic ID needs with high-density layout.' 
  },
  { 
    amount: 47, 
    photos: 30, 
    label: 'Value', 
    validityDays: 1, 
    uses: 1, 
    description: 'Maximum density pack. Best for families or multiple document types. Optimized for A4 printing.' 
  },
  { 
    amount: 49, 
    photos: 37, 
    label: 'Premium', 
    validityDays: 1, 
    uses: 1, 
    description: 'Elite Studio Quality. Features facial detail enhancement and official government-grade verification.' 
  },
  { 
    amount: 60, 
    photos: 45, 
    label: 'Premium 1+', 
    validityDays: 1, 
    uses: 1, 
    description: 'Full-sheet capacity. Highest possible photo count per page. Best for heavy-duty studio printing.' 
  }
];

export const USD_PRICING = [
  { 
    amount: 5, 
    photos: 21, 
    label: 'Standard', 
    validityDays: 1, 
    uses: 1, 
    description: 'Digital-ready high resolution grid. Standard layout for passports and international IDs.' 
  },
  { 
    amount: 10, 
    photos: 30, 
    label: 'Value', 
    validityDays: 1, 
    uses: 1, 
    description: 'Bundle pack for multi-document applications. Ideal for comprehensive Visa sets and family IDs.' 
  },
  { 
    amount: 15, 
    photos: 37, 
    label: 'Premium', 
    validityDays: 1, 
    uses: 1, 
    description: 'Top-tier Studio quality with priority AI processing and maximum resolution for pro-lab prints.' 
  }
];

export const INR_BULK_PLANS = [
  { 
    amount: 340, 
    label: 'Premium 1++', 
    description: 'Unlock 10 High-Quality Sessions. Save ₹30 instantly compared to single purchases.', 
    originalPrice: 370, 
    validity: '12 Months',
    validityDays: 365,
    uses: 10,
    icon: 'fa-layer-group'
  },
  { 
    amount: 430, 
    label: 'Premium 2++', 
    description: 'Our most popular Value Pack. Get 10 full-sheet sessions. Ideal for small businesses.', 
    originalPrice: 470, 
    validity: '12 Months',
    validityDays: 365,
    uses: 10,
    icon: 'fa-boxes-stacked'
  },
  { 
    amount: 410, 
    label: 'Premium 3++', 
    description: '10 Elite Ultra-HD Sessions. For users who demand professional studio-grade results every time.', 
    originalPrice: 490, 
    validity: '12 Months',
    validityDays: 365,
    uses: 10,
    icon: 'fa-crown'
  },
  { 
    amount: 1000, 
    label: 'Gold Premium', 
    description: 'Bulk Enterprise Tier. 30 High-Resolution sessions. Massive savings for frequent power users.', 
    originalPrice: 1110, 
    validity: '12 Months',
    validityDays: 365,
    uses: 30,
    icon: 'fa-gem',
    isGold: true
  }
];

export const USD_BULK_PLANS = [
  { 
    amount: 50, 
    label: 'Premium 1++', 
    description: 'Buy 10 sessions, get 1 FREE. Total 11 Standard HD sessions. No expiry for 1 year.', 
    originalPrice: 55, 
    validity: '12 Months',
    validityDays: 365,
    uses: 11,
    icon: 'fa-layer-group'
  },
  { 
    amount: 100, 
    label: 'Premium 2++', 
    description: 'Ultimate Value Bundle. 12 High-density sessions. Perfect for international families.', 
    originalPrice: 120, 
    validity: '12 Months',
    validityDays: 365,
    uses: 12,
    icon: 'fa-boxes-stacked'
  },
  { 
    amount: 150, 
    label: 'Premium 3++', 
    description: 'Elite Pro Pack. 13 Maximum resolution sessions. Priority access to the AI editing engine.', 
    originalPrice: 195, 
    validity: '12 Months',
    validityDays: 365,
    uses: 13,
    icon: 'fa-crown'
  },
  { 
    amount: 200, 
    label: 'Gold Premium 1++', 
    description: 'Bulk Power User. 41 Standard sessions. Save $5 instantly with year-long validity.', 
    originalPrice: 205, 
    validity: '12 Months',
    validityDays: 365,
    uses: 41,
    icon: 'fa-gem',
    isGold: true
  }
];

export const PHOTO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '3.5 x 4.5 cm': { width: 35, height: 45 },
  '3.5 x 4.5 cm (UK)': { width: 35, height: 45 },
  '2 x 2 inch': { width: 50.8, height: 50.8 },
  '2 x 2 inch (Visa)': { width: 50.8, height: 50.8 },
  '2.5 x 2.5 cm': { width: 25, height: 25 },
  '2 x 2.5 cm (Stamp)': { width: 20, height: 25 },
  '3 x 4 cm': { width: 30, height: 40 }
};

export const PAPER_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '3.5 x 5 inch (3R)': { width: 88.9, height: 127 },
  '6 x 4 inch (4R)': { width: 152.4, height: 101.6 },
  '7 x 5 inch (5R)': { width: 177.8, height: 127 },
  'A6 (10.5 x 14.85 cm)': { width: 105, height: 148.5 },
  'A5 (21 x 14.85 cm)': { width: 148.5, height: 210 },
  'A4 (29.7 x 21 cm)': { width: 210, height: 297 },
  'A3 (42 x 29.7 cm)': { width: 297, height: 420 },
  'Letter (8.5 x 11 inch)': { width: 215.9, height: 279.4 }
};

export const UPI_ID = 'ikvivsp6@ybl';
export const PAY_NUMBER = '9823818455'; 
export const RECIPIENT_NAME = 'Vicky Patekar';
export const REPORT_EMAIL = 'musicianstarboi@gmail.com';
export const COMPLAINT_WHATSAPP = '9823818455';
