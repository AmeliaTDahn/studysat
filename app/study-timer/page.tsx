"use client";

import React, { useState, useEffect } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Navigation from '../components/Navigation';
import { FaPlay, FaPause, FaStop, FaClock, FaHistory } from 'react-icons/fa';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const TIMER_TYPES = {
  POMODORO: { label: 'Focus Session', duration: 25 * 60, type: 'focus' },
  SHORT_BREAK: { label: 'Short Break', duration: 5 * 60, type: 'short_break' },
  LONG_BREAK: { label: 'Long Break', duration: 15 * 60, type: 'long_break' },
};

interface Subject {
  id: string;
  name: string;
}

interface DatabaseSession {
  id: string;
  duration: number;
  started_at: string;
  subject: { name: string }[];
}

interface StudySession {
  id: string;
  subject: { name: string };
  duration: number;
  started_at: string;
}

export default function StudyTimerPage() {
  const [timerType, setTimerType] = useState('POMODORO');
  const [timeLeft, setTimeLeft] = useState(TIMER_TYPES.POMODORO.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const supabase = createClientComponentClient();

  // Fetch subjects and recent sessions
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch subjects
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('id, name')
            .eq('user_id', user.id)
            .order('name');

          if (subjectsError) throw subjectsError;
          setSubjects(subjectsData || []);

          // Fetch recent sessions
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
            .limit(3);

          if (sessionsError) throw sessionsError;
          
          const formattedSessions = (sessions || []).map((session: DatabaseSession) => ({
            id: session.id,
            duration: session.duration,
            started_at: session.started_at,
            subject: { name: session.subject[0].name }
          }));
          
          setRecentSessions(formattedSessions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerTypeChange = (type: string) => {
    setTimerType(type);
    setTimeLeft(TIMER_TYPES[type as keyof typeof TIMER_TYPES].duration);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const toggleTimer = () => {
    if (!selectedSubject) {
      alert('Please select a subject before starting the timer');
      return;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(TIMER_TYPES[timerType as keyof typeof TIMER_TYPES].duration);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const handleSessionComplete = async () => {
    if (!sessionStartTime || !selectedSubject) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const duration = TIMER_TYPES[timerType as keyof typeof TIMER_TYPES].duration;
      const sessionType = TIMER_TYPES[timerType as keyof typeof TIMER_TYPES].type;

      // Create study session
      await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id: selectedSubject,
        duration: duration,
        session_type: sessionType,
        started_at: sessionStartTime.toISOString(),
        ended_at: new Date().toISOString()
      });

      // Refresh recent sessions
      const { data: sessions } = await supabase
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
        .limit(3);

      const formattedSessions = (sessions || []).map((session: DatabaseSession) => ({
        id: session.id,
        duration: session.duration,
        started_at: session.started_at,
        subject: { name: session.subject[0].name }
      }));
      
      setRecentSessions(formattedSessions);
      resetTimer();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
            Study Timer
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Timer Section */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-8">
              {/* Timer Type Selection */}
              <div className="flex justify-center space-x-4 mb-8">
                {Object.entries(TIMER_TYPES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleTimerTypeChange(key)}
                    className={`px-6 py-3 rounded-lg transition duration-200 ${
                      timerType === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="text-8xl font-bold text-gray-900 mb-4">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={toggleTimer}
                    className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                  >
                    {isRunning ? <FaPause /> : <FaPlay />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-4 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition duration-200"
                  >
                    <FaStop />
                  </button>
                </div>
              </div>

              {/* Subject Selection */}
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  disabled={isRunning}
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaHistory className="mr-2" />
                Recent Sessions
              </h2>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-gray-500">Loading recent sessions...</p>
                ) : recentSessions.length === 0 ? (
                  <p className="text-gray-500">No recent sessions yet</p>
                ) : (
                  recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{session.subject.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(session.started_at)}</p>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaClock className="mr-2" />
                          {formatTime(session.duration)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 