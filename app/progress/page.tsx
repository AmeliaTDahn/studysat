"use client";

import React, { useEffect, useState } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Navigation from '../components/Navigation';
import {
  FaClock,
  FaFile,
  FaChartLine,
  FaCalendarAlt,
  FaCheckCircle,
  FaFileUpload,
} from 'react-icons/fa';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

interface StudyStatistics {
  total_study_time: number;
  total_documents: number;
  total_subjects: number;
  avg_session_length: number;
}

interface Document {
  id: string;
  name: string;
  subject: { name: string };
  created_at: string;
  file_size: number;
}

interface StudySession {
  id: string;
  subject: { name: string };
  duration: number;
  started_at: string;
}

interface DatabaseDocument {
  id: string;
  name: string;
  file_size: number;
  created_at: string;
  subject: { name: string }[];
}

interface DatabaseSession {
  id: string;
  duration: number;
  started_at: string;
  subject: { name: string }[];
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudyStatistics | null>(null);
  const [recentUploads, setRecentUploads] = useState<Document[]>([]);
  const [studyHistory, setStudyHistory] = useState<{ date: string; sessions: StudySession[] }[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch study statistics
          const { data: statsData, error: statsError } = await supabase
            .from('study_statistics')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (statsError) throw statsError;
          setStats(statsData);

          // Fetch recent documents
          const { data: documents, error: docsError } = await supabase
            .from('documents')
            .select(`
              id,
              name,
              file_size,
              created_at,
              subject:subjects!inner(name)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (docsError) throw docsError;
          
          const formattedDocs = (documents || []).map((doc: DatabaseDocument) => ({
            id: doc.id,
            name: doc.name,
            file_size: doc.file_size,
            created_at: doc.created_at,
            subject: { name: doc.subject[0].name }
          }));
          
          setRecentUploads(formattedDocs);

          // Fetch recent study sessions grouped by date
          const { data: sessions, error: sessionsError } = await supabase
            .from('study_sessions')
            .select(`
              id,
              duration,
              started_at,
              subject:subjects!inner(name)
            `)
            .eq('user_id', user.id)
            .eq('session_type', 'focus')
            .order('started_at', { ascending: false })
            .limit(10);

          if (sessionsError) throw sessionsError;

          const formattedSessions = (sessions || []).map((session: DatabaseSession) => ({
            id: session.id,
            duration: session.duration,
            started_at: session.started_at,
            subject: { name: session.subject[0].name }
          }));

          // Group sessions by date
          const groupedSessions = formattedSessions.reduce((acc, session) => {
            const date = new Date(session.started_at).toISOString().split('T')[0];
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(session);
            return acc;
          }, {} as Record<string, StudySession[]>);

          // Convert to array format
          const historyData = Object.entries(groupedSessions).map(([date, sessions]) => ({
            date,
            sessions
          }));

          setStudyHistory(historyData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className={poppins.className}>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
              Study Progress
            </h1>
            <div className="text-center text-gray-600">Loading your progress...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
            Study Progress
          </h1>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaClock className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Total Study Time</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats?.total_study_time || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaFile className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Documents Uploaded</h3>
              </div>
              <p className="text-3xl font-bold">{stats?.total_documents || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaChartLine className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Subjects Studied</h3>
              </div>
              <p className="text-3xl font-bold">{stats?.total_subjects || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaCalendarAlt className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Avg. Session Length</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats?.avg_session_length || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Uploads */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaFileUpload className="mr-2" />
                Recent Uploads
              </h2>
              <div className="space-y-4">
                {recentUploads.length === 0 ? (
                  <p className="text-gray-500">No documents uploaded yet</p>
                ) : (
                  recentUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{upload.name}</h3>
                          <p className="text-sm text-gray-500">
                            {upload.subject.name} • {formatDate(upload.created_at)}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">{formatFileSize(upload.file_size)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Study History */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaCheckCircle className="mr-2" />
                Study History
              </h2>
              <div className="space-y-6">
                {studyHistory.length === 0 ? (
                  <p className="text-gray-500">No study sessions recorded yet</p>
                ) : (
                  studyHistory.map((day, index) => (
                    <div key={index}>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">{formatDate(day.date)}</h3>
                      <div className="space-y-3">
                        {day.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{session.subject.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {formatDuration(session.duration)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 