
import React from 'react';

export const PRICING = [
  { amount: 37, photos: 21, label: 'Standard' },
  { amount: 47, photos: 30, label: 'Value' },
  { amount: 49, photos: 37, label: 'Premium' },
  { amount: 60, photos: 45, label: 'Premium 1+' }
];

export const BULK_PLANS = [
  { 
    amount: 340, 
    label: 'Premium 1++', 
    description: '10 Uses of ₹37 Plan', 
    originalPrice: 370, 
    validity: '2 Months',
    icon: 'fa-layer-group'
  },
  { 
    amount: 430, 
    label: 'Premium 2++', 
    description: '10 Uses of ₹47 Plan', 
    originalPrice: 470, 
    validity: '2 Months',
    icon: 'fa-boxes-stacked'
  },
  { 
    amount: 410, 
    label: 'Premium 3++', 
    description: '10 Uses of ₹49 Plan', 
    originalPrice: 490, 
    validity: '2 Months',
    icon: 'fa-crown'
  },
  { 
    amount: 1000, 
    label: 'Gold Premium', 
    description: '30 Uses of ₹37 Plan', 
    originalPrice: 1110, 
    validity: '12 Months',
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

export const UPI_ID = 'r1patekar6@oksbi';
export const PAY_NUMBER = '7020612450'; 
export const RECIPIENT_NAME = 'Vicky Patekar';
export const REPORT_EMAIL = 'musicianstarboi@gmail.com';
export const COMPLAINT_WHATSAPP = '9823818455';
