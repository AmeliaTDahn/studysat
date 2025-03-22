"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaBook, FaChartLine, FaClock, FaGraduationCap, FaUpload, FaFile, FaClock as FaTimer, FaCalendarAlt } from 'react-icons/fa';
import Navigation from '../components/Navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Document {
  id: string;
  title: string;
  created_at: string;
  subject: string;
}

interface StudySession {
  id: string;
  duration: number;
  created_at: string;
  subject: string;
}

const menuItems = [
  {
    title: 'Subjects',
    description: 'Manage your study materials and documents by subject',
    icon: <FaBook className="w-8 h-8" />,
    href: '/subjects',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Progress',
    description: 'Track your study progress and view analytics',
    icon: <FaChartLine className="w-8 h-8" />,
    href: '/progress',
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Calendar',
    description: 'Manage your test dates and homework deadlines',
    icon: <FaCalendarAlt className="w-8 h-8" />,
    href: '/calendar',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    title: 'Resources',
    description: 'Access study templates and helpful resources',
    icon: <FaGraduationCap className="w-8 h-8" />,
    href: '/resources',
    color: 'bg-orange-100 text-orange-600'
  }
];

export default function HomePage() {
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch recent documents
          const { data: documents, error: docError } = await supabase
            .from('documents')
            .select('id, title, created_at, subject')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (docError) throw docError;

          // Fetch recent study sessions
          const { data: sessions, error: sessionError } = await supabase
            .from('study_sessions')
            .select('id, duration, created_at, subject')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (sessionError) throw sessionError;

          setRecentDocuments(documents || []);
          setRecentSessions(sessions || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to StudyBuddy</h1>
          <Link
            href="/subjects"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <FaUpload className="w-5 h-5" />
            <span>Upload Document</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                  <p className="mt-1 text-gray-600">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-gray-600">Loading your recent activity...</p>
          ) : recentDocuments.length === 0 && recentSessions.length === 0 ? (
            <p className="text-gray-600">No recent activity yet. Start by uploading a document!</p>
          ) : (
            <div className="space-y-6">
              {recentDocuments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Documents</h3>
                  <div className="space-y-2">
                    {recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-3 text-gray-600">
                        <FaFile className="w-4 h-4" />
                        <span className="flex-1">{doc.title}</span>
                        <span className="text-sm">{formatDate(doc.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {recentSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Study Sessions</h3>
                  <div className="space-y-2">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center space-x-3 text-gray-600">
                        <FaTimer className="w-4 h-4" />
                        <span className="flex-1">{session.subject}</span>
                        <span className="text-sm">{formatDuration(session.duration)}</span>
                        <span className="text-sm">{formatDate(session.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 