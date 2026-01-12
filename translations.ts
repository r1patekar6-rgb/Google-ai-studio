
export type TranslationKey = 
  | 'pricing' | 'how_it_works' | 'templates' | 'support' | 'login' | 'get_pro'
  | 'hero_title_1' | 'hero_title_2' | 'hero_desc' | 'start_creating'
  | 'standard_grids' | 'standard_desc' | 'bulk_savings' | 'bulk_desc'
  | 'best_choice' | 'print' | 'photos_grid' | 'official_size' | 'ai_retouch' | 'formats'
  | 'save_statement' | 'activate_plan' | 'original_price' | 'validity'
  | 'ai_tools' | 'in_clothes' | 'crop_portrait' | 'editing_suite' | 're_crop' | 'finish_preview'
  | 'photo_enhance' | 'remove_bg' | 'bg_color' | 'custom_hex' | 'apply_bg' | 'output_standard' | 'paper_layout'
  | 'review_title' | 'workspace_desc' | 'order_summary' | 'total_photos' | 'sheet_count' | 'photo_size' | 'layout_format' | 'resolution'
  | 'proceed_payment' | 'secure_checkout' | 'enter_access_key' | 'auth_desc' | 'unlock_hd' | 'incorrect_code'
  | 'active_session' | 'photos_layout' | 'back' | 'select_quality' | 'quality_desc' | 'lossless_format' | 'direct_pdf' 
  | 'access_unlocked' | 'confirm_start' | 'ai_working' | 'ai_applying' | 'search_lang' | 'choose' | 'standard_label' | 'value_label' | 'premium_label'
  | 'download_png' | 'download_pdf' | 'generating_hd' | 'encoding_data' | 'footer_copy' | 'back_to_plans' | 'access_key' | 'enter_code'
  | 'pay_securely' | 'scan_to_pay' | 'pay_to_number' | 'payment_instructions' | 'upload_receipt' | 'verifying_payment' | 'verify_failed'
  | 'sign_up' | 'full_name' | 'phone_number' | 'email_id' | 'create_password' | 'password_req' | 'register_now' | 'logout' | 'welcome';

export const TRANSLATIONS: Record<string, Partial<Record<TranslationKey, string>>> = {
  'English (US)': {
    pricing: 'Pricing',
    how_it_works: 'How it works',
    templates: 'Templates',
    support: 'Support',
    login: 'Login',
    get_pro: 'Get Pro',
    hero_title_1: 'Professional',
    hero_title_2: 'Passports in 60s',
    hero_desc: 'The most advanced AI studio for official passport photos. Perfect cropping, auto-retouching, and print-ready grids.',
    start_creating: 'Start Creating',
    standard_grids: 'Standard Grids',
    standard_desc: 'One-time professional layouts for single documents.',
    bulk_savings: 'Bulk Savings & Subscriptions',
    bulk_desc: 'Maximize your savings with our professional multi-use packages.',
    best_choice: 'Best Choice',
    print: 'print',
    photos_grid: 'Photos Grid',
    official_size: 'Official Size Verification',
    ai_retouch: 'Premium AI Retouch',
    formats: 'PNG & PDF Formats',
    save_statement: 'Save 30 to 40 years from A4 photos.save PDF or PNG',
    activate_plan: 'Activate Plan',
    validity: 'Valid for',
    ai_tools: 'AI Tools',
    in_clothes: 'In Clothes',
    crop_portrait: 'Crop your Portrait',
    editing_suite: 'Professional Editing Suite',
    re_crop: 'RE-CROP',
    finish_preview: 'Finish & Preview Grid',
    photo_enhance: 'Photo Enhance',
    remove_bg: 'Remove BG',
    bg_color: 'Background Color',
    custom_hex: 'Custom Hex',
    apply_bg: 'Apply Background',
    output_standard: 'Output Standard',
    paper_layout: 'Paper Layout',
    review_title: 'Print Layout Review',
    workspace_desc: 'Sheet Preview',
    order_summary: 'Review Order',
    total_photos: 'Total Photos',
    sheet_count: 'Sheet Count',
    photo_size: 'Photo Size',
    layout_format: 'Layout Format',
    resolution: 'Resolution',
    proceed_payment: 'Proceed to Payment',
    secure_checkout: 'Secure Checkout Verified',
    enter_access_key: 'Enter Access Key',
    auth_desc: 'Provide your unique authorization code to enable high-resolution downloads.',
    unlock_hd: 'UNLOCK HD ACCESS',
    incorrect_code: 'Incorrect authorization code',
    active_session: 'Active Studio Session',
    photos_layout: 'Photos Layout',
    back: 'Back',
    select_quality: 'Select Export Quality',
    quality_desc: 'Recommended for best print results',
    lossless_format: 'Lossless Digital Format',
    direct_pdf: 'Direct PDF Document',
    access_unlocked: 'Access Unlocked!',
    confirm_start: 'Confirm & Start',
    ai_working: 'AI Studio Working',
    ai_applying: 'Applying professional modifications...',
    search_lang: 'Search language...',
    choose: 'Choose',
    standard_label: 'Standard',
    value_label: 'Value',
    premium_label: 'Premium',
    download_png: 'DOWNLOAD PNG',
    download_pdf: 'DOWNLOAD PDF',
    generating_hd: 'GENERATING HD LAYOUT',
    encoding_data: 'Encoding high-density multi-page data...',
    footer_copy: '2025 BluePrint Studio • India\'s Leading Passport AI',
    back_to_plans: 'Back to Plans',
    access_key: 'Payment Verification',
    enter_code: 'Code...',
    pay_securely: 'Complete Payment',
    scan_to_pay: 'Scan QR to Pay',
    pay_to_number: 'Pay to Number',
    payment_instructions: 'Pay the plan amount via GPay, PhonePe, or Paytm to the number below. Upload the screenshot for instant AI verification.',
    upload_receipt: 'Upload Payment Screenshot',
    verifying_payment: 'Verifying with AI...',
    verify_failed: 'Verification failed. Please upload a valid UPI screenshot.',
    sign_up: 'Sign Up',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    email_id: 'Email Address',
    create_password: 'Create Password',
    password_req: 'Requires: 2 Alphabets, 1 Symbol, 3 Digits',
    register_now: 'Register Studio Account',
    logout: 'Logout',
    welcome: 'Welcome'
  }
};
