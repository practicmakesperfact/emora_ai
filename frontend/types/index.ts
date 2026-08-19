// ============================================================
// Emora AI — TypeScript Types
// Matches FastAPI backend Pydantic schemas exactly
// ============================================================

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub: string;       // User ID as string
  email?: string;
  role?: string;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole = 'User' | 'Counselor' | 'Admin';

export interface Role {
  id: number;
  name: UserRole;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  preferred_language: string;
  time_zone: string;
  mental_wellness_goal?: string;
  emergency_contact?: string;
  role_id: number;
  role?: Role;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  preferred_language?: string;
  time_zone?: string;
  mental_wellness_goal?: string;
  emergency_contact?: string;
  role_name?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  preferred_language?: string;
  time_zone?: string;
  mental_wellness_goal?: string;
  emergency_contact?: string;
  password?: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string;
  intent?: string;
  source_citations?: Record<string, unknown>;
  is_crisis_triggered: boolean;
  created_at: string;
}

export interface MessageCreate {
  content: string;
}

export interface ConversationSummaryResponse {
  conversation_id: number;
  summary: string;
}

export interface SearchResult {
  message_id: number;
  conversation_id: number;
  conversation_title: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ConversationSearchResponse {
  query: string;
  results: SearchResult[];
}

export interface MoodLog {
  id: number;
  user_id: number;
  score: number;
  mood_notes?: string;
  emotions?: string[];
  created_at: string;
  updated_at: string;
}

export interface MoodLogCreate {
  score: number;
  mood_notes?: string;
  emotions?: string[];
}

export interface DailyMoodAverage {
  date: string;
  average_score: number;
  count: number;
}

export interface MoodStatSummary {
  average_score: number;
  total_logs: number;
  emotion_frequencies: Record<string, number>;
}

export interface MoodTrendsResponse {
  period: string;
  summary: MoodStatSummary;
  daily_averages: DailyMoodAverage[];
}

export interface Journal {
  id: number;
  user_id: number;
  content: string;
  ai_summary?: string;
  emotions?: string[];
  keywords?: string[];
  created_at: string;
  updated_at: string;
}

export interface JournalCreate {
  content: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: number;
  user_id: number;
  conversation_id?: number;
  message_content: string;
  risk_level: RiskLevel;
  action_taken: string;
  resolved: boolean;
  counselor_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentResolve {
  counselor_notes?: string;
}

export interface KnowledgeDocument {
  id: number;
  title: string;
  author?: string;
  source?: string;
  upload_date: string;
  file_name: string;
}

export interface RAGSearchResult {
  content: string;
  source: string;
  title: string;
  score: number;
}

export interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
