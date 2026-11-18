// ============================================================
// Emora AI — Emergency Contacts (Central Config)
// Single source of truth used by: support page, crisis card, sidebar
//
// ⚠️  IMPORTANT: Do NOT change phone numbers without calling them first.
//     Update `lastVerified` and `source` after each verification.
//
// Numbers currently listed are sourced from the existing Emora codebase.
// Owner should verify all numbers before production deployment.
// ============================================================

export interface EmergencyContact {
  id: string;
  /** Short display name in English */
  nameEn: string;
  /** Short display name in Amharic */
  nameAm: string;
  /** Dialable phone number (digits only, no spaces) */
  number: string;
  /** Category for grouping */
  category: 'hotline' | 'emergency' | 'hospital' | 'counseling' | 'local';
  /** Availability in English */
  availabilityEn: string;
  /** Availability in Amharic */
  availabilityAm: string;
  /** Short description in English */
  descriptionEn: string;
  /** Short description in Amharic */
  descriptionAm: string;
  /** Location / coverage */
  location?: string;
  /** ISO date string — last time this number was personally verified */
  lastVerified: string;
  /** Source of the number (website, official directory, etc.) */
  source: string;
  /** Whether to show this as a primary tap-to-call button in the crisis card */
  showInCrisisCard: boolean;
}

// ─── Verified contacts ────────────────────────────────────────────────────────
// ⚠️  Please verify each number and update lastVerified + source before release.

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // ── Hotlines ──────────────────────────────────────────────────────────────
  {
    id: 'mental-health-helpline',
    nameEn: 'Mental Health Helpline',
    nameAm: 'የአእምሮ ጤና የስልክ መስመር',
    number: '8335',
    category: 'hotline',
    availabilityEn: 'Free · 24/7',
    availabilityAm: 'ነፃ · 24/7',
    descriptionEn: 'Free, confidential mental health support. Available around the clock.',
    descriptionAm: 'ነፃ፣ ሚስጢራዊ የአእምሮ ጤና ድጋፍ። ቀን ከሌሊቱ ይሰራል።',
    location: 'Ethiopia (national)',
    lastVerified: '2024-01-01', // ⚠️ TODO: update after personal verification
    source: 'Ethiopian Ministry of Health / existing Emora codebase',
    showInCrisisCard: true,
  },

  // ── Emergency services ────────────────────────────────────────────────────
  {
    id: 'emergency-general',
    nameEn: 'General Emergency',
    nameAm: 'አጠቃላይ የአደጋ ጊዜ',
    number: '991',
    category: 'emergency',
    availabilityEn: '24/7',
    availabilityAm: '24/7',
    descriptionEn: 'General emergency line.',
    descriptionAm: 'አጠቃላይ የአደጋ ጊዜ ስልክ።',
    location: 'Ethiopia (national)',
    lastVerified: '2024-01-01', // ⚠️ TODO: verify — correction_prompt.md flags 939 vs 991 discrepancy
    source: 'Existing Emora support page',
    showInCrisisCard: false,
  },
  {
    id: 'police',
    nameEn: 'Police',
    nameAm: 'ፖሊስ',
    number: '939',
    category: 'emergency',
    availabilityEn: '24/7',
    availabilityAm: '24/7',
    // ⚠️ NOTE: correction_prompt.md says "police line is 991 and fire is 939".
    // The existing support page lists 939 as Police. Please verify and update.
    descriptionEn: '⚠️ Verify: may be Police or Fire. Update this entry after calling.',
    descriptionAm: '⚠️ ያረጋግጡ: ፖሊስ ወይም እሳት አደጋ መሆኑን ያረጋግጡ።',
    location: 'Ethiopia (national)',
    lastVerified: '2024-01-01', // ⚠️ TODO: must verify
    source: 'Existing Emora system prompt — number disputed, see correction_prompt.md',
    showInCrisisCard: true,
  },
  {
    id: 'ambulance',
    nameEn: 'Ambulance',
    nameAm: 'አምቡላንስ',
    number: '907',
    category: 'emergency',
    availabilityEn: '24/7',
    availabilityAm: '24/7',
    descriptionEn: 'Ambulance / medical emergency services.',
    descriptionAm: 'አምቡላንስ / ሕክምና አደጋ ጊዜ አገልግሎቶች።',
    location: 'Addis Ababa',
    lastVerified: '2024-01-01', // ⚠️ TODO: verify
    source: 'Existing Emora codebase',
    showInCrisisCard: true,
  },

  // ── Hospitals (Addis Ababa) ───────────────────────────────────────────────
  {
    id: 'amanuel-hospital',
    nameEn: 'Amanuel Mental Specialized Hospital',
    nameAm: 'አማኑኤል የአእምሮ ጤና ስፔሻላይዝድ ሆስፒታል',
    number: '',
    category: 'hospital',
    availabilityEn: 'Outpatient & emergency',
    availabilityAm: 'ወጪ ታካሚ እና ድንገተኛ',
    descriptionEn: "Ethiopia's primary public psychiatric hospital — acute psychiatric conditions, severe depression, and mental health crises.",
    descriptionAm: 'የኢትዮጵያ ዋነኛ የሕዝብ የስነ-ልቦና ሆስፒታል — አስቸኳይ የስነ-ልቦና ሁኔታዎች።',
    location: 'Addis Ababa, Ethiopia',
    lastVerified: '2024-01-01',
    source: 'Existing Emora codebase',
    showInCrisisCard: false,
  },
  {
    id: 'tikur-anbessa',
    nameEn: 'Tikur Anbessa (Black Lion) Hospital',
    nameAm: 'ጥቁር አንበሳ ስፔሻላይዝድ ሆስፒታል',
    number: '',
    category: 'hospital',
    availabilityEn: 'Emergency department',
    availabilityAm: 'ድንገተኛ ክፍለ ሰዓት',
    descriptionEn: 'Comprehensive specialized hospital with psychiatric and emergency services.',
    descriptionAm: 'የስነ-ልቦና እና ድንገተኛ አገልግሎቶች ያሉት ሆስፒታል።',
    location: 'Addis Ababa, Ethiopia',
    lastVerified: '2024-01-01',
    source: 'Existing Emora codebase',
    showInCrisisCard: false,
  },
  {
    id: 'st-pauls',
    nameEn: "St. Paul's Hospital Millennium Medical College",
    nameAm: 'ቅዱስ ጳውሎስ ሆስፒታል',
    number: '',
    category: 'hospital',
    availabilityEn: 'Emergency department',
    availabilityAm: 'ድንገተኛ ክፍለ ሰዓት',
    descriptionEn: 'Major teaching hospital with mental health and emergency departments.',
    descriptionAm: 'የአዕምሮ ጤና እና ድንገተኛ ሕክምና ያለው ዋነኛ ሆስፒታል።',
    location: 'Addis Ababa, Ethiopia',
    lastVerified: '2024-01-01',
    source: 'Existing Emora codebase',
    showInCrisisCard: false,
  },

  // ── Private counseling ────────────────────────────────────────────────────
  {
    id: 'fitret-counseling',
    nameEn: 'Fitret Counseling',
    nameAm: 'ፍጥረት ምክር አገልግሎት',
    number: '+251915484852',
    category: 'counseling',
    availabilityEn: 'By appointment',
    availabilityAm: 'በቀጠሮ',
    descriptionEn: 'Professional therapy and counseling services in Addis Ababa.',
    descriptionAm: 'በአዲስ አበባ ሙያዊ ሕክምና እና ምክር አገልግሎቶች።',
    location: 'Addis Ababa, Ethiopia',
    lastVerified: '2024-01-01',
    source: 'Existing Emora support page',
    showInCrisisCard: false,
  },

  // ── Local resources (Wollo / Dessie) ─────────────────────────────────────
  // ⚠️ TODO: Fill in the actual phone numbers and details for these two entries.
  {
    id: 'wollo-university-counseling',
    nameEn: 'Wollo University Student Counseling Office',
    nameAm: 'ወሎ ዩኒቨርሲቲ የተማሪ ምክር ቢሮ',
    number: '', // ⚠️ TODO: add phone number
    category: 'local',
    availabilityEn: 'Office hours — TODO: verify',
    availabilityAm: 'የቢሮ ሰዓታት — ያረጋግጡ',
    descriptionEn: 'On-campus counseling services for Wollo University students. ⚠️ TODO: add details.',
    descriptionAm: 'ለወሎ ዩኒቨርሲቲ ተማሪዎች ምክር አገልግሎቶች። ⚠️ ዝርዝሮችን ያክሉ።',
    location: 'Dessie, Amhara Region, Ethiopia',
    lastVerified: '', // ⚠️ TODO: fill after verification
    source: '⚠️ TODO: add source',
    showInCrisisCard: false,
  },
  {
    id: 'dessie-referral-hospital',
    nameEn: 'Dessie Comprehensive Specialized Hospital',
    nameAm: 'ደሴ ሁሉ አቀፍ ስፔሻላይዝድ ሆስፒታል',
    number: '', // ⚠️ TODO: add phone number
    category: 'local',
    availabilityEn: 'Emergency department — TODO: verify hours',
    availabilityAm: 'ድንገተኛ ክፍለ ሰዓት — ሰዓቱን ያረጋግጡ',
    descriptionEn: 'Main referral hospital in Dessie with psychiatric services. ⚠️ TODO: add details.',
    descriptionAm: 'በደሴ ዋነኛ ሆስፒታል። ⚠️ ዝርዝሮችን ያክሉ።',
    location: 'Dessie, Amhara Region, Ethiopia',
    lastVerified: '', // ⚠️ TODO: fill after verification
    source: '⚠️ TODO: add source',
    showInCrisisCard: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All contacts shown in the crisis card as tap-to-call buttons */
export const CRISIS_CARD_CONTACTS = EMERGENCY_CONTACTS.filter(
  (c) => c.showInCrisisCard && c.number
);

/** Contacts grouped by category for the support page */
export function getContactsByCategory(category: EmergencyContact['category']) {
  return EMERGENCY_CONTACTS.filter((c) => c.category === category);
}

/** The most recently verified date across all contacts (for the "last verified" note) */
export const CONTACTS_LAST_VERIFIED = EMERGENCY_CONTACTS.filter(
  (c) => c.lastVerified
).reduce((latest, c) => (c.lastVerified > latest ? c.lastVerified : latest), '');
