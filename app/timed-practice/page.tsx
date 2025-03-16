"use client";

import React, { useState } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import Navigation from '../components/Navigation';
import { FaClock, FaPlay, FaPause, FaStopwatch } from 'react-icons/fa';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const practiceOptions = [
  {
    duration: 25,
    description: 'Pomodoro Session',
    type: 'Focus Time'
  },
  {
    duration: 45,
    description: 'Extended Study',
    type: 'Deep Work'
  },
  {
    duration: 90,
    description: 'Full Study Block',
    type: 'Intensive Study'
  }
];

export default function TimedPracticePage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setIsStarted(false);
  };

  const startPractice = () => {
    setIsStarted(true);
  };

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
            Study Timer
          </h1>

          {!isStarted ? (
            <div>
              <p className="text-xl text-gray-600 mb-8 text-center">
                Choose a study duration to maintain focus and track your progress
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {practiceOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`p-6 rounded-xl transition duration-300 ${
                      selectedOption === index
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <FaClock className={`w-8 h-8 ${
                        selectedOption === index ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2">
                      {option.description}
                    </h3>
                    <div className="space-y-2 text-center">
                      <p className="text-gray-600">
                        <FaStopwatch className="inline mr-2" />
                        {option.duration} minutes
                      </p>
                      <p className="text-gray-600">
                        {option.type}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={startPractice}
                  disabled={selectedOption === null}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 ${
                    selectedOption !== null
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Start Study Session
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Timer and question component will be added here */}
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-6xl font-bold text-blue-600 mb-4">
                    {practiceOptions[selectedOption!].duration}:00
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                      <FaPlay className="w-6 h-6" />
                    </button>
                    <button className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                      <FaPause className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsStarted(false)}
                  className="text-blue-600 font-medium hover:text-blue-800"
                >
                  Cancel Practice
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 