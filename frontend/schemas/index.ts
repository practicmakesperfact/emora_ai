// ============================================================
// Emora AI — Zod Validation Schemas
// Form validation matching backend constraints
// ============================================================

import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be 100 characters or less'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be 100 characters or less'),
  confirmPassword: z.string(),
  role_name: z.enum(['User', 'Counselor', 'Admin']).default('User'),
  preferred_language: z.string().max(10).default('en'),
  time_zone: z.string().max(50).default('UTC'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── User Profile Schema ──────────────────────────────────────────────────

/** Ethiopian phone: +251 9XXXXXXXX, +251 7XXXXXXXX, 09XXXXXXXX, 07XXXXXXXX */
const ethiopianPhone = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (v) => !v || /^(\+2519\d{8}|\+2517\d{8}|09\d{8}|07\d{8})$/.test(v.replace(/\s/g, '')),
    { message: 'Enter a valid Ethiopian phone: +251 9XX…, 09XX…, or 07XX…' }
  );

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100)
    .optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  mental_wellness_goal: z.string().max(500).optional().or(z.literal('')),
  // Emergency contact — split into 3 sub-fields
  ec_name: z.string().max(80).optional().or(z.literal('')),
  ec_relationship: z.string().max(50).optional().or(z.literal('')),
  ec_phone: ethiopianPhone,
  // Password change — separate section; never pre-filled
  current_password: z.string().optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100)
    .optional()
    .or(z.literal('')),
}).refine(
  (d) => {
    // If new password is provided, current_password must also be provided
    if (d.password && d.password.length > 0) {
      return !!(d.current_password && d.current_password.length > 0);
    }
    return true;
  },
  { message: 'Enter your current password to set a new one', path: ['current_password'] }
);

// ─── Mood Schema ─────────────────────────────────────────────────────────

export const moodSchema = z.object({
  score: z
    .number()
    .int()
    .min(1, 'Please select a mood score')
    .max(10, 'Mood score must be 10 or below'),
  mood_notes: z.string().max(1000).optional().or(z.literal('')),
  emotions: z.array(z.string()).optional(),
});

// ─── Journal Schema ───────────────────────────────────────────────────────

export const journalSchema = z.object({
  content: z
    .string()
    .min(1, 'Journal entry cannot be empty')
    .max(10000, 'Journal entry is too long'),
});

// ─── Document Upload Schema ───────────────────────────────────────────────

export const documentUploadSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  author: z.string().max(100).optional().or(z.literal('')),
  source: z.string().max(200).optional().or(z.literal('')),
});

// ─── Incident Resolve Schema ──────────────────────────────────────────────

export const incidentResolveSchema = z.object({
  counselor_notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional()
    .or(z.literal('')),
});

// ─── Types from schemas ───────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type MoodFormData = z.infer<typeof moodSchema>;
export type JournalFormData = z.infer<typeof journalSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type IncidentResolveFormData = z.infer<typeof incidentResolveSchema>;
