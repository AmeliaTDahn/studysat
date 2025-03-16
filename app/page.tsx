"use client";

import React from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <main className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 ${poppins.className}`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Navigation Bar */}
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className={`${playfair.className} text-2xl font-bold text-gray-900`}>
              Study<span className="text-blue-600">Buddy</span>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1.5 rounded-full">Smart Study Assistant</span>
          </div>
          <h1 className={`${playfair.className} text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight`}>
            Master Your Studies<span className="text-blue-600">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Your personal study companion for academic success. Smart guidance, practice exercises, and personalized learning paths.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <Link href="/subjects" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Start Learning
            </Link>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
              Create Study Plan
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="border-r border-gray-200 last:border-0">
              <p className="text-4xl font-bold text-blue-600">50+</p>
              <p className="text-gray-600 mt-2">Subjects Covered</p>
            </div>
            <div className="border-r border-gray-200 last:border-0">
              <p className="text-4xl font-bold text-blue-600">100k+</p>
              <p className="text-gray-600 mt-2">Practice Questions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">95%</p>
              <p className="text-gray-600 mt-2">Student Success Rate</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 border-t-4 border-blue-500">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">All Subjects</h3>
            <p className="text-gray-600">Comprehensive coverage of various subjects with detailed explanations and step-by-step solutions.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 border-t-4 border-purple-500">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Learning</h3>
            <p className="text-gray-600">Personalized study plans that adapt to your progress and focus on areas where you need the most improvement.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 border-t-4 border-yellow-500">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Practice & Review</h3>
            <p className="text-gray-600">Interactive exercises with detailed explanations and performance tracking over time.</p>
          </div>
        </div>
        
        {/* Testimonial */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="relative">
            <svg className="h-12 w-12 text-blue-600 mb-4" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>
            <p className="text-xl text-gray-600 mb-6 italic">
              "This study platform transformed my learning experience. The personalized approach helped me focus on my weak areas, and I saw significant improvement in my grades!"
            </p>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">JD</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold">Jamie Doe</p>
                <p className="text-gray-500 text-sm">Student</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className={`${playfair.className} text-3xl md:text-4xl font-bold text-gray-900 mb-6`}>
            Ready to improve your grades?
          </h2>
          <button className="bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Get Started Today
          </button>
        </div>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
} 