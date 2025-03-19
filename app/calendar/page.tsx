'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog } from '@headlessui/react';
import Navigation from '../components/Navigation';
import { Playfair_Display, Poppins } from 'next/font/google';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AiStudySuggestions from '../components/AiStudySuggestions';
import DocumentSelector from '../components/DocumentSelector';
import { CalendarEvent, StudyDocument } from '../types';
import StudyEventModal from '../components/StudyEventModal';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedEndDate: Date | null;
  onEventAdded: () => void;
  currentView: 'month' | 'week' | 'day';
}

interface DocumentResponse {
  importance: number;
  notes: string | null;
  documents: {
    id: string;
    name: string;
    file_url: string;
    created_at: string;
  };
}

interface ViewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete: () => void;
  onEventUpdated: () => void;
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

interface CalendarEventDB {
  id: string;
  title: string;
  description: string | null;
  event_type: 'test' | 'homework' | 'study_session' | 'other';
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  subject_id: string | null;
  subjects: { name: string } | null;
}

interface CalendarEventDocument {
  importance: number;
  notes: string | null;
  documents: {
    id: string;
    name: string;
    file_url: string;
    created_at: string;
  };
}

const EVENT_COLORS = {
  test: {
    backgroundColor: '#FEE2E2', // light red
    borderColor: '#DC2626', // red-600
    color: '#991B1B' // red-800
  },
  homework: {
    backgroundColor: '#E0E7FF', // light indigo
    borderColor: '#4F46E5', // indigo-600
    color: '#3730A3' // indigo-800
  },
  study_session: {
    backgroundColor: '#D1FAE5', // light green
    borderColor: '#059669', // green-600
    color: '#065F46' // green-800
  },
  other: {
    backgroundColor: '#FEF3C7', // light yellow
    borderColor: '#D97706', // yellow-600
    color: '#92400E' // yellow-800
  }
};

const EventModal = ({ isOpen, onClose, selectedDate, selectedEndDate, onEventAdded, currentView }: EventModalProps) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventType: 'homework',
    startDate: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
    endDate: selectedEndDate ? format(selectedEndDate, "yyyy-MM-dd'T'HH:mm") : '',
    allDay: false,
    subjectId: ''
  });
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Fetch subjects when modal opens
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      setEventData(prev => ({
        ...prev,
        startDate: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
        endDate: selectedEndDate ? format(selectedEndDate, "yyyy-MM-dd'T'HH:mm") : format(selectedDate, "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [selectedDate, selectedEndDate]);

  const fetchSubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      setSubjects(subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const eventToInsert = {
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.eventType,
        start_date: eventData.startDate,
        end_date: eventData.endDate || null,
        all_day: eventData.allDay,
        subject_id: eventData.subjectId || null
      };

      const { error } = await supabase
        .from('calendar_events')
        .insert([eventToInsert]);

      if (error) throw error;

      onEventAdded();
      onClose();
      setEventData({
        title: '',
        description: '',
        eventType: 'homework',
        startDate: '',
        endDate: '',
        allDay: false,
        subjectId: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">Add New Event</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Type</label>
              <select
                value={eventData.eventType}
                onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="homework">Homework</option>
                <option value="test">Test</option>
                <option value="study_session">Study Session</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                value={eventData.subjectId}
                onChange={(e) => setEventData({ ...eventData, subjectId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a subject (optional)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="datetime-local"
                  value={eventData.startDate}
                  onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  readOnly={currentView !== 'month'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="datetime-local"
                  value={eventData.endDate}
                  onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  readOnly={currentView !== 'month'}
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={eventData.allDay}
                onChange={(e) => setEventData({ ...eventData, allDay: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="ml-2 block text-sm text-gray-900">
                All day event
              </label>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Event'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, title }: DeleteConfirmationDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Event</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{title}"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export function ViewEventModal({ isOpen, onClose, event, onDelete, onEventUpdated }: ViewEventModalProps) {
  const [linkedDocuments, setLinkedDocuments] = useState<StudyDocument[]>([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const supabase = createClientComponentClient();

  // If this is a study event, extract the learning objectives and overview
  const isStudyEvent = event?.description?.includes('Learning objectives:') ?? false;
  const learningObjectives = isStudyEvent && event?.description ? 
    event.description
      .split('Learning objectives:')[1]
      .split('\n\n')[0]
      .split(/\(\d+\)/)
      .filter(obj => obj.trim())
      .map(obj => obj.trim()) : [];
  
  // Extract overview text, stopping at Study Methods section
  const overview = isStudyEvent && event?.description ?
    event.description
      .split('Learning objectives:')[1]
      .split('\n\n')
      .slice(1)
      .join('\n\n')
      .split('Study Methods:')[0]
      .trim() : event?.description ?? '';

  // Extract study methods if they exist
  const studyMethods = (isStudyEvent && event?.description?.includes('Study Methods:')) ?
    event.description
      .split('Study Methods:')[1]
      .split('---')
      .map(methodStr => {
        const [methodName, ...rest] = methodStr.trim().split('\n');
        const applicationStart = rest.indexOf('Step-by-Step Application:');
        const rationaleStart = rest.indexOf('Why This Method Works:');
        
        return {
          method: methodName.trim(),
          application: rest
            .slice(applicationStart + 1, rationaleStart)
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.trim().substring(2)),
          rationale: rest.slice(rationaleStart + 1).join('\n').trim()
        };
      }) : [];

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Delete the event
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id)
        .eq('user_id', session.user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Close both modals and refresh events
      setIsDeleteConfirmationOpen(false);
      onClose();
      onDelete();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!event) return;
    
    try {
      const { error } = await supabase
        .from('calendar_event_documents')
        .delete()
        .eq('event_id', event.id)
        .eq('document_id', documentId);

      if (error) throw error;
      fetchLinkedDocuments();
    } catch (error) {
      console.error('Error unlinking document:', error);
    }
  };

  useEffect(() => {
    if (event?.id) {
      fetchLinkedDocuments();
    }
  }, [event?.id]);

  const fetchLinkedDocuments = async () => {
    if (!event?.id) return;

    try {
      const { data, error } = await supabase
        .from('calendar_event_documents')
        .select(`
          importance,
          notes,
          documents:document_id (
            id,
            name,
            file_url,
            created_at
          )
        `)
        .eq('event_id', event.id);

      if (error) throw error;

      // Type assertion for the response data
      const responseData = data as unknown as Array<{
        importance: number;
        notes: string | null;
        documents: {
          id: string;
          name: string;
          file_url: string;
          created_at: string;
        };
      }>;

      const formattedDocs = responseData.map(item => ({
        id: item.documents.id,
        name: item.documents.name,
        file_url: item.documents.file_url,
        created_at: item.documents.created_at,
        importance: item.importance,
        notes: item.notes
      }));

      setLinkedDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching linked documents:', error);
    }
  };

  const getImportanceLabel = (importance: number) => {
    switch (importance) {
      case 1: return 'Low';
      case 2: return 'Medium-Low';
      case 3: return 'Medium';
      case 4: return 'Medium-High';
      case 5: return 'High';
      default: return 'Medium';
    }
  };

  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 1: return 'text-gray-500';
      case 2: return 'text-blue-500';
      case 3: return 'text-green-500';
      case 4: return 'text-orange-500';
      case 5: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    eventType: string;
    allDay: boolean;
    subjectId?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session.user.id,
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.eventType,
          start_date: eventData.startTime.toISOString(),
          end_date: eventData.endTime.toISOString(),
          all_day: eventData.allDay,
          subject_id: eventData.subjectId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh events after creating a new one
      onEventUpdated();
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  if (!isOpen || !event) return null;

  return isStudyEvent ? (
    <StudyEventModal
      isOpen={isOpen}
      onClose={onClose}
      onDelete={handleDeleteEvent}
      title={event.title}
      date={event.start.toISOString()}
      subject={event.subject ?? ''}
      learningObjectives={learningObjectives}
      overview={overview}
      studyMethods={studyMethods}
    />
  ) : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Overview</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                {format(event.start, 'PPP')}
                {event.end && format(event.start, 'P') !== format(event.end, 'P') && (
                  <> - {format(event.end, 'PPP')}</>
                )}
              </p>
              {event.subject && (
                <p className="text-gray-700">
                  <span className="font-medium">Subject:</span> {event.subject}
                </p>
              )}
              {event.description && (
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              )}
            </div>
          </div>

          {/* Study Materials Section */}
          {(event.eventType === 'test' || event.eventType === 'homework') && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Study Materials</h3>
              {linkedDocuments.length > 0 ? (
                <ul className="space-y-4">
                  {linkedDocuments.map((doc) => (
                    <li key={doc.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{doc.name}</span>
                            <span className={`text-sm font-medium ${getImportanceColor(doc.importance)}`}>
                              ({getImportanceLabel(doc.importance)} Importance)
                            </span>
                          </div>
                          {doc.notes && (
                            <p className="text-sm text-gray-600 mt-1">{doc.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No study materials linked yet.</p>
              )}
              <div className="mt-4">
                <DocumentSelector
                  eventId={event.id}
                  onLinkComplete={fetchLinkedDocuments}
                />
              </div>
            </div>
          )}

          {/* Study Methods Section */}
          {(event.eventType === 'test' || event.eventType === 'homework') && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Study Methods</h3>
              <AiStudySuggestions
                documents={linkedDocuments}
                eventDate={event.start}
                onCreateEvent={(newEvent) => {
                  handleCreateEvent({
                    ...newEvent,
                    eventType: 'study_session',
                    allDay: false,
                    subjectId: event.subjectId,
                  });
                  onEventUpdated();
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={() => setIsDeleteConfirmationOpen(true)}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            Delete Event
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={handleDeleteEvent}
        title={event.title}
      />
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: calendarEvents, error } = await supabase
        .from('calendar_events')
        .select('*, subjects(name)')
        .eq('user_id', user.id)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString());

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = calendarEvents.map((event: CalendarEventDB) => ({
        id: event.id,
        title: event.title,
        start: parseISO(event.start_date),
        end: event.end_date ? parseISO(event.end_date) : parseISO(event.start_date),
        allDay: event.all_day,
        description: event.description || undefined,
        eventType: event.event_type,
        subjectId: event.subject_id || undefined,
        subject: event.subjects?.name
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (currentView === 'month') {
      // When clicking a day in month view, switch to day view for that date
      setCurrentDate(slotInfo.start);
      setCurrentView('day');
    } else {
      // For week and day views, open the event creation modal with the selected time range
      setSelectedDate(slotInfo.start);
      setSelectedEndDate(slotInfo.end);
      setIsAddEventModalOpen(true);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewEventModalOpen(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: EVENT_COLORS[event.eventType].backgroundColor,
      borderColor: EVENT_COLORS[event.eventType].borderColor,
      color: EVENT_COLORS[event.eventType].color,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '4px',
    };
    return { style };
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1">
      <div className="font-medium">{event.title}</div>
      {event.subject && (
        <div className="text-sm opacity-75">{event.subject}</div>
      )}
    </div>
  );

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'PREV':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          newDate.setDate(newDate.getDate() + 1);
        }
        break;
      case 'TODAY':
        newDate.setTime(new Date().getTime());
        break;
    }
    setCurrentDate(newDate);
  };

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`${playfair.className} text-4xl font-bold text-gray-900`}>
              Academic Calendar
            </h1>
            <div className="flex gap-4">
              {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: colors.backgroundColor, borderColor: colors.borderColor, borderWidth: 1 }}
                  />
                  <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 relative z-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleNavigate('TODAY')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => handleNavigate('PREV')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNavigate('NEXT')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </button>
                {currentView === 'day' && (
                  <div className="ml-4 text-lg font-medium text-gray-900">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    currentView === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setCurrentView('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    currentView === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCurrentView('day')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    currentView === 'day'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
            <div className="calendar-container" style={{ height: '800px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: EventComponent,
                  toolbar: () => null // This removes the default toolbar
                }}
                view={currentView}
                onView={(view) => setCurrentView(view as 'month' | 'week' | 'day')}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                views={['month', 'week', 'day']}
                step={30}
                timeslots={2}
                min={new Date(0, 0, 0, 0, 0, 0)} // 12:00 AM
                max={new Date(0, 0, 0, 23, 59, 59)} // 11:59 PM
                scrollToTime={new Date(0, 0, 0, 6, 0, 0)} // Scroll to 6 AM by default
                tooltipAccessor={event => `${event.title}${event.subject ? ` - ${event.subject}` : ''}`}
              />
            </div>
            <style jsx global>{`
              .rbc-time-view {
                overflow-y: auto !important;
                max-height: 800px;
              }
              .rbc-time-content {
                overflow-y: visible !important;
              }
              .rbc-time-gutter .rbc-timeslot-group {
                min-height: 50px;
              }
              .rbc-timeslot-group {
                min-height: 50px;
              }
              .rbc-current-time-indicator {
                z-index: 3;
                position: absolute;
                left: 0;
                height: 1px;
                background-color: #74ad31;
                pointer-events: none;
                width: 100%;
              }
              .rbc-calendar {
                z-index: 0;
              }
            `}</style>
          </div>
          <EventModal
            isOpen={isAddEventModalOpen}
            onClose={() => setIsAddEventModalOpen(false)}
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            onEventAdded={fetchEvents}
            currentView={currentView}
          />
          <ViewEventModal
            isOpen={isViewEventModalOpen}
            onClose={() => {
              setIsViewEventModalOpen(false);
              setSelectedEvent(null);
            }}
            event={selectedEvent}
            onDelete={fetchEvents}
            onEventUpdated={fetchEvents}
          />
        </div>
      </main>
    </div>
  );
} 