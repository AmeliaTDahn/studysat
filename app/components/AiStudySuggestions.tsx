import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { StudyDocument, StudyEvent, StudyMethod } from '../types';
import { Dialog } from '@headlessui/react';

interface TimePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startTime: Date) => void;
  suggestedDuration: number;
}

function TimePickerDialog({ isOpen, onClose, onConfirm, suggestedDuration }: TimePickerDialogProps) {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error('Invalid time format');
        }

        // Create date in local timezone by using the user's timezone offset
        const [year, month, day] = selectedDate.split('-').map(Number);
        const dateTime = new Date(year, month - 1, day);
        if (isNaN(dateTime.getTime())) {
          throw new Error('Invalid date');
        }

        // Set time components in local timezone
        dateTime.setHours(hours, minutes, 0, 0);

        if (isNaN(dateTime.getTime())) {
          throw new Error('Invalid date/time combination');
        }

        onConfirm(dateTime);
        onClose();
      } catch (err) {
        console.error('Error creating date:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">Schedule Study Session</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <p className="text-sm text-gray-500">
              Duration: {suggestedDuration} minutes
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

interface LearningObjectivesProps {
  objectives: string[];
}

function LearningObjectives({ objectives }: LearningObjectivesProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Learning Objectives</h4>
      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <div key={index} className="flex items-start text-sm text-gray-600">
            <span className="mr-2">{index + 1}.</span>
            <span>{objective}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AiStudySuggestionsProps {
  documents: StudyDocument[];
  eventDate: Date;
  onCreateEvent: (event: { title: string; description: string; startTime: Date; endTime: Date }) => void;
}

export default function AiStudySuggestions({ documents, eventDate, onCreateEvent }: AiStudySuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StudyEvent[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<StudyEvent | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchStoredSuggestions = async () => {
      try {
        const response = await fetch(`/api/study-suggestions/${eventDate.toISOString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stored suggestions');
        }
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Error fetching stored suggestions:', err);
      }
    };

    fetchStoredSuggestions();
  }, [eventDate]);

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/study-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents,
          eventDate: eventDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);

    } catch (err) {
      console.error('Error generating study suggestions:', err);
      setError('Failed to generate study suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (suggestion: StudyEvent) => {
    setSelectedSuggestion(suggestion);
    setIsTimePickerOpen(true);
  };

  const handleTimeSelected = async (startTime: Date) => {
    if (!selectedSuggestion) return;

    try {
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time');
      }

      const duration = Number(selectedSuggestion.suggestedDuration);
      if (isNaN(duration) || duration <= 0) {
        throw new Error('Invalid duration');
      }

      // Calculate end time in local timezone
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

      if (isNaN(endTime.getTime())) {
        throw new Error('Invalid end time calculation');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Format study methods into the description
      const studyMethodsText = selectedSuggestion.studyMethods?.length 
        ? '\n\nStudy Methods:\n' + selectedSuggestion.studyMethods.map(method => `
${method.method}
Step-by-Step Application:
${method.application.split('\n').map(step => `• ${step.trim()}`).join('\n')}
Why This Method Works:
${method.rationale}
---`).join('\n')
        : '';

      // Create the full description with learning objectives and study methods
      const fullDescription = `${selectedSuggestion.description}${studyMethodsText}`;

      // Create the calendar event using local timezone dates
      const { data: calendarEvent, error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session.user.id,
          title: selectedSuggestion.title,
          description: fullDescription,
          event_type: 'study_session',
          start_date: startTime.toISOString(),
          end_date: endTime.toISOString(),
          all_day: false
        })
        .select()
        .single();

      if (calendarError) {
        throw new Error('Failed to create calendar event');
      }

      // Link documents from the AI study event to the new calendar event
      const { error: linkError } = await supabase
        .rpc('link_ai_event_documents', {
          ai_event_id: selectedSuggestion.id,
          calendar_event_id: calendarEvent.id
        });

      if (linkError) {
        console.error('Error linking documents:', linkError);
        // Don't throw here, as the event was created successfully
      }

      // Create the suggestion record
      const { data: suggestionData, error: suggestionError } = await supabase
        .from('ai_calendar_suggestions')
        .insert({
          user_id: session.user.id,
          title: selectedSuggestion.title,
          description: fullDescription,
          priority: 3,
          recommended_duration: `${duration} minutes`,
          start_date: startTime.toISOString(),
          end_date: endTime.toISOString(),
          status: 'accepted'
        })
        .select()
        .single();

      if (suggestionError) {
        throw new Error('Failed to store suggestion');
      }

      setIsTimePickerOpen(false);
      setError(null);

    } catch (err) {
      console.error('Error creating study event:', err);
      setError('Failed to create study event. Please try again.');
      setIsTimePickerOpen(false);
    }
  };

  const formatNumberedList = (text: string) => {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const match = line.match(/^(\d+\.\s*)(.*)/);
        if (match) {
          return `${match[1]}${match[2]}`;
        }
        return line;
      });
  };

  const extractLearningObjectives = (description: string): string[] => {
    const learningObjMatch = description.match(/Learning objectives:(.*?)(?=\n\n|$)/s);
    if (!learningObjMatch) return [];
    
    return learningObjMatch[1]
      .split(/\(\d+\)/)
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0);
  };

  const formatDescription = (description: string): string => {
    return description.replace(/Learning objectives:.*?(?=\n\n|$)/s, '').trim();
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">Study Suggestions</h2>
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Duration: {suggestion.suggestedDuration} minutes
                </p>
              </div>
              <button
                onClick={() => handleCreateEvent(suggestion)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Event
              </button>
            </div>

            <LearningObjectives 
              objectives={extractLearningObjectives(suggestion.description)} 
            />

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Overview</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {formatDescription(suggestion.description)}
              </p>
            </div>

            {suggestion.studyMethods && suggestion.studyMethods.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Study Methods</h4>
                <div className="space-y-4">
                  {suggestion.studyMethods.map((method, methodIndex) => (
                    <div key={methodIndex} className="bg-white rounded-md p-4 border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">{method.method}</h5>
                      
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Step-by-Step Application</h6>
                        <div className="text-sm text-gray-600 space-y-2">
                          {formatNumberedList(method.application).map((step, stepIndex) => (
                            <p key={stepIndex} className="pl-4">
                              {step}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Why This Method Works</h6>
                        <p className="text-sm text-gray-600">
                          {method.rationale}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <TimePickerDialog
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={handleTimeSelected}
        suggestedDuration={selectedSuggestion?.suggestedDuration || 0}
      />
    </div>
  );
} 