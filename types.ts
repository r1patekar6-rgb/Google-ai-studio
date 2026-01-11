
export enum PhotoSize {
  INDIA_PASSPORT = '3.5 x 4.5 cm',
  UK_PASSPORT = '3.5 x 4.5 cm (UK)',
  US_PASSPORT = '2 x 2 inch',
  VISA = '2 x 2 inch (Visa)',
  PAN_CARD = '2.5 x 2.5 cm',
  STAMP_SIZE = '2 x 2.5 cm (Stamp)',
  ID_SMALL = '3 x 4 cm'
}

export enum PaperLayout {
  R3 = '3.5 x 5 inch (3R)',
  R4 = '6 x 4 inch (4R)',
  R5 = '7 x 5 inch (5R)',
  A6 = 'A6 (10.5 x 14.85 cm)',
  A5 = 'A5 (21 x 14.85 cm)',
  A4 = 'A4 (29.7 x 21 cm)',
  A3 = 'A3 (42 x 29.7 cm)',
  LETTER = 'Letter (8.5 x 11 inch)'
}

export interface PhotoConfig {
  size: PhotoSize;
  layout: PaperLayout;
}

export enum VerificationStatus {
  IDLE = 'IDLE',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface VerificationResult {
  status: VerificationStatus;
  message?: string;
  amount?: number;
}