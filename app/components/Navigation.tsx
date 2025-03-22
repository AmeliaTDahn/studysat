"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaBook, FaChartLine, FaGraduationCap, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';

const navItems = [
  {
    label: 'Home',
    href: '/home',
    icon: <FaHome className="w-5 h-5" />
  },
  {
    label: 'Subjects',
    href: '/subjects',
    icon: <FaBook className="w-5 h-5" />
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: <FaChartLine className="w-5 h-5" />
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: <FaCalendarAlt className="w-5 h-5" />
  },
  {
    label: 'Study Materials',
    href: '/study-materials',
    icon: <FaFileAlt className="w-5 h-5" />
  },
  {
    label: 'Resources',
    href: '/resources',
    icon: <FaGraduationCap className="w-5 h-5" />
  }
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
      isActive(path)
        ? 'bg-blue-100 text-blue-600'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              StudyBuddy
            </Link>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 