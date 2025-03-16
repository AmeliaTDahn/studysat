"use client";

import React, { useState, useEffect } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
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
  POMODORO: { label: 'Focus Session', duration: 25 * 60 },
  SHORT_BREAK: { label: 'Short Break', duration: 5 * 60 },
  LONG_BREAK: { label: 'Long Break', duration: 15 * 60 },
};

export default function StudyTimerPage() {
  const [timerType, setTimerType] = useState('POMODORO');
  const [timeLeft, setTimeLeft] = useState(TIMER_TYPES.POMODORO.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Mock data for demonstration
  const recentSessions = [
    { id: 1, subject: 'Biology', duration: '25:00', date: '2024-03-15 14:30' },
    { id: 2, subject: 'History', duration: '25:00', date: '2024-03-15 13:00' },
    { id: 3, subject: 'Mathematics', duration: '25:00', date: '2024-03-15 11:30' },
  ];

  const subjects = ['Biology', 'History', 'Mathematics', 'Physics', 'Literature'];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerTypeChange = (type: string) => {
    setTimerType(type);
    setTimeLeft(TIMER_TYPES[type as keyof typeof TIMER_TYPES].duration);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(TIMER_TYPES[timerType as keyof typeof TIMER_TYPES].duration);
    setIsRunning(false);
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
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
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
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.subject}</p>
                        <p className="text-sm text-gray-500">{session.date}</p>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaClock className="mr-2" />
                        {session.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 