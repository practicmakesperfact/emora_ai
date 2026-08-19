// ============================================================
// Emora AI — Constants
// Centralized string constants and configuration
// ============================================================

// ─── App Info ─────────────────────────────────────────────────────────────

export const APP_NAME = 'Emora';
export const APP_TAGLINE = 'AI-Powered Mental Health Support';
export const APP_DISCLAIMER =
  'This is an AI-based mental health support assistant. It is not a licensed mental health professional and does not provide medical diagnosis or treatment.';

// ─── Routes ───────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PRIVACY: '/privacy',
  ABOUT: '/about',
  SUPPORT: '/support',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  MOOD: '/mood',
  JOURNAL: '/journal',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  COUNSELOR_DASHBOARD: '/counselor/dashboard',
  COUNSELOR_INCIDENTS: '/counselor/incidents',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_USERS: '/admin/users',
} as const;

// ─── Role Names ───────────────────────────────────────────────────────────

export const ROLES = {
  USER: 'User',
  COUNSELOR: 'Counselor',
  ADMIN: 'Admin',
} as const;

// ─── Mood Labels ──────────────────────────────────────────────────────────

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very difficult',
  2: 'Quite difficult',
  3: 'Difficult',
  4: 'A bit low',
  5: 'Neutral',
  6: 'Fairly okay',
  7: 'Good',
  8: 'Very good',
  9: 'Great',
  10: 'Excellent',
};

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😔',
  2: '😟',
  3: '😕',
  4: '🙁',
  5: '😐',
  6: '🙂',
  7: '😊',
  8: '😄',
  9: '😁',
  10: '🌟',
};

// ─── Common Emotions ──────────────────────────────────────────────────────

export const COMMON_EMOTIONS = [
  'happy',
  'calm',
  'anxious',
  'sad',
  'grateful',
  'stressed',
  'hopeful',
  'frustrated',
  'content',
  'overwhelmed',
  'peaceful',
  'lonely',
  'energetic',
  'tired',
  'confident',
  'worried',
];

// ─── Crisis Levels ────────────────────────────────────────────────────────

export const CRISIS_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// ─── Supported Languages ──────────────────────────────────────────────────

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
];

// ─── Accepted File Types ──────────────────────────────────────────────────

export const ACCEPTED_DOC_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

export const MAX_FILE_SIZE_MB = 50;

// ─── Privacy Notice ───────────────────────────────────────────────────────

export const PRIVACY_NOTICE =
  'To protect your privacy, avoid sharing sensitive personal details like your full name or ID number. This conversation may be stored to help improve the service.';

export const CHAT_PLACEHOLDER =
  "Share what's on your mind. I'm here to listen and support you.";
