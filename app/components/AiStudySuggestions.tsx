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
        // Parse the time string
        const [hours, minutes] = selectedTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error('Invalid time format');
        }

        // Create date object for selected date at midnight
        const dateTime = new Date(selectedDate);
        if (isNaN(dateTime.getTime())) {
          throw new Error('Invalid date');
        }

        // Set the time components
        dateTime.setHours(hours);
        dateTime.setMinutes(minutes);
        dateTime.setSeconds(0);
        dateTime.setMilliseconds(0);

        // Validate final datetime
        if (isNaN(dateTime.getTime())) {
          throw new Error('Invalid date/time combination');
        }

        onConfirm(dateTime);
        onClose();
      } catch (err) {
        console.error('Error creating date:', err);
        // You might want to show this error to the user
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
                className="px-3 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
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
    <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500 mb-6">
      <h4 className="text-sm font-semibold text-blue-800 mb-4">Learning Objectives</h4>
      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <div key={index} className="flex items-start text-sm text-blue-700">
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

  // Fetch stored suggestions when component mounts or eventDate changes
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
        // Don't show error to user, just log it - they can still generate new suggestions
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
      // Ensure we have a valid date and suggested duration
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time');
      }

      // Convert duration to a number and validate
      const duration = Number(selectedSuggestion.suggestedDuration);
      if (isNaN(duration) || duration <= 0) {
        console.error('Invalid duration:', selectedSuggestion.suggestedDuration);
        throw new Error('Invalid duration');
      }

      // Calculate end time by adding minutes to start time
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

      // Double check end time is valid
      if (isNaN(endTime.getTime())) {
        throw new Error('Invalid end time calculation');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Store in ai_calendar_suggestions
      const { data: suggestionData, error: suggestionError } = await supabase
        .from('ai_calendar_suggestions')
        .insert({
          user_id: session.user.id,
          title: selectedSuggestion.title,
          description: `${selectedSuggestion.description}\n\n` +
            `Study Methods:\n` +
            selectedSuggestion.studyMethods?.map(method => 
              `\n${method.method}\n` +
              `Step-by-Step Application:\n` +
              method.application.split(/\d+\./).filter(Boolean).map(step => 
                `• ${step.trim()}`
              ).join('\n') +
              `\n\nWhy This Method Works:\n${method.rationale}\n`
            ).join('\n---\n') || '',
          priority: 3, // Default priority
          recommended_duration: `${duration} minutes`,
          start_date: startTime.toISOString(),
          end_date: endTime.toISOString(),
          status: 'accepted',
          ai_explanation: selectedSuggestion.studyMethods?.map(m => 
            `${m.method}: ${m.application}`
          ).join('\n') || 'No specific study methods provided'
        })
        .select()
        .single();

      if (suggestionError) {
        throw new Error('Failed to store suggestion');
      }

      // Create the calendar event with both start and end times
      onCreateEvent({
        title: selectedSuggestion.title,
        description: `${selectedSuggestion.description}\n\n` +
          `Study Methods:\n` +
          selectedSuggestion.studyMethods?.map(method => 
            `\n${method.method}\n` +
            `Step-by-Step Application:\n` +
            method.application.split(/\d+\./).filter(Boolean).map(step => 
              `• ${step.trim()}`
            ).join('\n') +
            `\n\nWhy This Method Works:\n${method.rationale}\n`
          ).join('\n---\n') || '',
        startTime,
        endTime,
      });

      setIsTimePickerOpen(false);
      setError(null);

    } catch (err) {
      console.error('Error creating study event:', err);
      setError('Failed to create study event. Please try again.');
      setIsTimePickerOpen(false);
    }
  };

  const formatNumberedList = (text: string) => {
    // This will preserve numbers at the start of each item
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // If line starts with a number followed by a dot, preserve it
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
    // Remove the learning objectives section from the main description
    return description.replace(/Learning objectives:.*?(?=\n\n|$)/s, '').trim();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-900">AI Study Suggestions</h2>
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {suggestions.map((suggestion, index) => (
          <div key={index}>
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-blue-700">
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

              <div>
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Overview</h4>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">
                  {formatDescription(suggestion.description)}
                </p>
              </div>
            </div>

            <LearningObjectives 
              objectives={extractLearningObjectives(suggestion.description)} 
            />

            {suggestion.studyMethods && suggestion.studyMethods.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-4">Study Methods</h4>
                <div className="space-y-4">
                  {suggestion.studyMethods.map((method, methodIndex) => (
                    <div key={methodIndex} className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-3">{method.method}</h5>
                      
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-blue-800 mb-2">Step-by-Step Application</h6>
                        <div className="text-sm text-blue-700 space-y-2">
                          {formatNumberedList(method.application).map((step, stepIndex) => (
                            <p key={stepIndex} className="pl-4">
                              {step}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-medium text-blue-800 mb-2">Why This Method Works</h6>
                        <p className="text-sm text-blue-700">
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