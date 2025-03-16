"use client";

import React from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
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

// Mock data for demonstration
const studyStats = {
  totalStudyTime: '45h 30m',
  documentsUploaded: 24,
  subjectsStudied: 5,
  averageSessionLength: '45m',
};

const recentUploads = [
  {
    id: 1,
    name: 'Biology Chapter 5 Notes.pdf',
    subject: 'Biology',
    date: '2024-03-15',
    size: '2.4 MB',
  },
  {
    id: 2,
    name: 'History Essay Research.docx',
    subject: 'History',
    date: '2024-03-14',
    size: '1.8 MB',
  },
  {
    id: 3,
    name: 'Physics Formulas.pdf',
    subject: 'Physics',
    date: '2024-03-13',
    size: '1.2 MB',
  },
];

const studyHistory = [
  {
    date: '2024-03-15',
    sessions: [
      { subject: 'Biology', duration: '1h 30m', documents: 2 },
      { subject: 'History', duration: '45m', documents: 1 },
    ],
  },
  {
    date: '2024-03-14',
    sessions: [
      { subject: 'Physics', duration: '2h', documents: 3 },
      { subject: 'Mathematics', duration: '1h', documents: 2 },
    ],
  },
];

export default function ProgressPage() {
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
              <p className="text-3xl font-bold">{studyStats.totalStudyTime}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaFile className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Documents Uploaded</h3>
              </div>
              <p className="text-3xl font-bold">{studyStats.documentsUploaded}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaChartLine className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Subjects Studied</h3>
              </div>
              <p className="text-3xl font-bold">{studyStats.subjectsStudied}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FaCalendarAlt className="text-blue-600 text-xl" />
                <h3 className="ml-2 text-gray-600">Avg. Session Length</h3>
              </div>
              <p className="text-3xl font-bold">{studyStats.averageSessionLength}</p>
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
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{upload.name}</h3>
                        <p className="text-sm text-gray-500">
                          {upload.subject} • {upload.date}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{upload.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Study History */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaCheckCircle className="mr-2" />
                Study History
              </h2>
              <div className="space-y-6">
                {studyHistory.map((day, index) => (
                  <div key={index}>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">{day.date}</h3>
                    <div className="space-y-3">
                      {day.sessions.map((session, sessionIndex) => (
                        <div
                          key={sessionIndex}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{session.subject}</h4>
                              <p className="text-sm text-gray-500">
                                {session.duration} • {session.documents} documents
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 