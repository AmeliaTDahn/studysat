import React from 'react';

export const metadata = {
  title: 'Calendar | StudySat',
  description: 'Manage your academic calendar and schedule study sessions',
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
} 