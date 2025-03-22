export interface StudyDocument {
  id: string;
  name: string;
  importance?: number;
  notes?: string;
}

export interface StudyMethod {
  method: string;
  application: string;
  rationale: string;
}

export interface StudyEvent {
  id?: string;
  title: string;
  description: string;
  suggestedDuration: number; // in minutes
  studyMethods?: StudyMethod[];
  status?: 'pending' | 'accepted' | 'rejected' | 'completed';
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  aiExplanation?: string;
  user_id?: string;
  original_event_id?: string;
  document_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  eventType: 'test' | 'homework' | 'study_session' | 'other';
  allDay: boolean;
  subjectId?: string;
} 