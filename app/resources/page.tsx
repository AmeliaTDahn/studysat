"use client";

import React from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import Navigation from '../components/Navigation';
import { FaBook, FaFileAlt, FaLightbulb, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const studyTips = [
  {
    id: 1,
    title: 'Active Recall',
    description: 'Test yourself frequently. Create flashcards, practice problems, or teach concepts to others.',
    icon: <FaLightbulb />,
  },
  {
    id: 2,
    title: 'Spaced Repetition',
    description: 'Review material at increasing intervals to strengthen long-term retention.',
    icon: <FaLightbulb />,
  },
  {
    id: 3,
    title: 'Mind Mapping',
    description: 'Create visual connections between related concepts to better understand complex topics.',
    icon: <FaLightbulb />,
  },
];

const templates = [
  {
    id: 1,
    title: 'Cornell Notes Template',
    description: 'A systematic format for condensing and organizing notes.',
    downloadLink: '#',
    icon: <FaFileAlt />,
  },
  {
    id: 2,
    title: 'Study Schedule Template',
    description: 'Weekly planner to organize your study sessions effectively.',
    downloadLink: '#',
    icon: <FaFileAlt />,
  },
  {
    id: 3,
    title: 'Summary Sheet Template',
    description: 'Format for creating concise topic summaries.',
    downloadLink: '#',
    icon: <FaFileAlt />,
  },
];

const helpfulLinks = [
  {
    id: 1,
    title: 'Khan Academy',
    description: 'Free online courses, lessons, and practice.',
    url: 'https://www.khanacademy.org',
  },
  {
    id: 2,
    title: 'Coursera',
    description: 'Online courses from top universities.',
    url: 'https://www.coursera.org',
  },
  {
    id: 3,
    title: 'MIT OpenCourseWare',
    description: 'Free access to MIT course materials.',
    url: 'https://ocw.mit.edu',
  },
];

export default function ResourcesPage() {
  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
            Study Resources
          </h1>

          {/* Study Tips Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FaBook className="mr-2" />
              Effective Study Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studyTips.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200"
                >
                  <div className="text-blue-600 text-xl mb-4">{tip.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Templates Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FaFileAlt className="mr-2" />
              Study Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="text-blue-600 text-xl mb-4">{template.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{template.title}</h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <a
                    href={template.downloadLink}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <FaDownload className="mr-2" />
                    Download Template
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Helpful Links Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FaExternalLinkAlt className="mr-2" />
              Helpful Learning Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {helpfulLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200"
                >
                  <h3 className="text-xl font-semibold mb-2">{link.title}</h3>
                  <p className="text-gray-600">{link.description}</p>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 