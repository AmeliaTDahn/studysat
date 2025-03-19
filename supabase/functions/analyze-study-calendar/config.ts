export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const OPENAI_MODEL = 'gpt-4-turbo-preview'

// Default study hours configuration
export const STUDY_HOURS = {
  WEEKDAY_START: '16:00', // 4 PM
  WEEKDAY_END: '21:00',   // 9 PM
  WEEKEND_START: '09:00', // 9 AM
  WEEKEND_END: '21:00',   // 9 PM
}

export interface StudyEvent {
  id: string
  title: string
  description: string | null
  event_type: 'test' | 'homework' | 'study_session' | 'other'
  start_date: string
  end_date: string | null
  subject_id: string | null
  linked_documents?: LinkedDocument[]
}

export interface StudyDocument {
  id: string
  name: string
  content_text: string | null
  document_analyses?: {
    content_text: string | null
  }[]
}

export interface LinkedDocument extends StudyDocument {
  importance: number
  notes: string | null
}

export interface StudySession {
  duration: number
  session_type: string
  started_at: string
}

export interface UnavailableTime {
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
  specific_date: string | null
  reason: string | null
}

export interface StudySuggestion {
  document_id: string | null
  title: string
  description: string
  priority: number
  recommended_duration: string
  start_date: string
  end_date: string | null
  ai_explanation: string
} 