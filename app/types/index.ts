export interface StudyDocument {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
  importance: number;
  notes?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  eventType: 'test' | 'homework' | 'study_session' | 'other';
  subjectId?: string;
  subject?: string;
}

export interface StudyEvent {
  title: string;
  description: string;
  suggestedDuration: number; // in minutes
} 