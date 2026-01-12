
import React from 'react';

export const INDIAN_LANGUAGES = [
  'Telugu', 'Assamese', 'Hindi', 'Chhattisgarhi', 'Konkani', 'Gujarati', 
  'Punjabi', 'Sanskrit', 'Santhali', 'Kannada', 'Malayalam', 'Marathi', 
  'Meitei (Manipuri)', 'Khasi', 'Mizo', 'Odia', 'Tamil', 'Bengali'
];

export const INR_PRICING = [
  { amount: 37, photos: 21, label: 'Standard', validityDays: 1, uses: 1 },
  { amount: 47, photos: 30, label: 'Value', validityDays: 1, uses: 1 },
  { amount: 49, photos: 37, label: 'Premium', validityDays: 1, uses: 1 },
  { amount: 60, photos: 45, label: 'Premium 1+', validityDays: 1, uses: 1 }
];

export const USD_PRICING = [
  { amount: 5, photos: 21, label: 'Standard', validityDays: 1, uses: 1 },
  { amount: 10, photos: 30, label: 'Value', validityDays: 1, uses: 1 },
  { amount: 15, photos: 37, label: 'Premium', validityDays: 1, uses: 1 }
];

export const INR_BULK_PLANS = [
  { 
    amount: 340, 
    label: 'Premium 1++', 
    description: '10 Uses of ₹37 Plan', 
    originalPrice: 370, 
    validity: '2 Months',
    validityDays: 60,
    uses: 10,
    icon: 'fa-layer-group'
  },
  { 
    amount: 430, 
    label: 'Premium 2++', 
    description: '10 Uses of ₹47 Plan', 
    originalPrice: 470, 
    validity: '2 Months',
    validityDays: 60,
    uses: 10,
    icon: 'fa-boxes-stacked'
  },
  { 
    amount: 410, 
    label: 'Premium 3++', 
    description: '10 Uses of ₹49 Plan', 
    originalPrice: 490, 
    validity: '2 Months',
    validityDays: 60,
    uses: 10,
    icon: 'fa-crown'
  },
  { 
    amount: 1000, 
    label: 'Gold Premium', 
    description: '30 Uses of ₹37 Plan', 
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
    description: '11 Uses of $5 Plan', 
    originalPrice: 55, 
    validity: '3 Months',
    validityDays: 90,
    uses: 11,
    icon: 'fa-layer-group'
  },
  { 
    amount: 100, 
    label: 'Premium 2++', 
    description: '12 Uses of $10 Plan', 
    originalPrice: 120, 
    validity: '4 Months',
    validityDays: 120,
    uses: 12,
    icon: 'fa-boxes-stacked'
  },
  { 
    amount: 150, 
    label: 'Premium 3++', 
    description: '13 Uses of $15 Plan', 
    originalPrice: 195, 
    validity: '6 Months',
    validityDays: 180,
    uses: 13,
    icon: 'fa-crown'
  },
  { 
    amount: 200, 
    label: 'Gold Premium 1++', 
    description: '41 Uses of $5 Plan', 
    originalPrice: 205, 
    validity: '1.5 Years',
    validityDays: 547,
    uses: 41,
    icon: 'fa-gem',
    isGold: true
  },
  { 
    amount: 400, 
    label: 'Gold Premium 2++', 
    description: '42 Uses of $10 Plan', 
    originalPrice: 420, 
    validity: '2.5 Years',
    validityDays: 912,
    uses: 42,
    icon: 'fa-shield-halved',
    isGold: true
  },
  { 
    amount: 600, 
    label: 'Gold Premium 3++', 
    description: '45 Uses of $15 Plan', 
    originalPrice: 675, 
    validity: '4 Years',
    validityDays: 1460,
    uses: 45,
    icon: 'fa-bolt-lightning',
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
