"use client";

import React, { useState, useEffect } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import Navigation from '../components/Navigation';
import { FaFileAlt, FaCalendarAlt, FaLightbulb, FaChevronRight } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../lib/database.types';
import StudySessionModal from '../components/StudySessionModal';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

interface StudyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  subject_id: string;
  subject_name: string | null;
}

export default function StudyMaterialsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StudyEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*, subjects(name)')
        .eq('event_type', 'study_session')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedEvents: StudyEvent[] = events?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.start_date,
        subject_id: event.subject_id,
        subject_name: event.subjects?.name || null
      })) || [];

      setUpcomingEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleGenerateMaterials = async (eventId: string) => {
    // This will be implemented later to generate study materials
    console.log('Generating materials for event:', eventId);
  };

  const handleEventClick = (event: StudyEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
            Study Materials
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Study Sessions Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-600" />
                  AI Study Sessions
                </h2>

                {loading ? (
                  <div className="text-center text-gray-600 py-8">
                    Loading study sessions...
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    No upcoming AI study sessions found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition duration-200 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {event.title}
                            </h3>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <span className="font-medium">{event.subject_name}</span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(event.event_date)}</span>
                            </div>
                          </div>
                          <FaChevronRight className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Study Tips Section */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <FaLightbulb className="mr-2 text-yellow-500" />
                  Study Tips
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Active Recall</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Test yourself on the material you've studied. Create flashcards or practice problems.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Spaced Repetition</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Review material at increasing intervals to strengthen memory retention.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Mind Mapping</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create visual connections between concepts to better understand relationships.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StudySessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        onGenerate={handleGenerateMaterials}
        formatDate={formatDate}
      />
    </div>
  );
} 