import React from 'react';

interface EventHeaderProps {
  date: string;
  subject: string;
}

export default function EventHeader({ date, subject }: EventHeaderProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium w-20">Date:</span>
          <span>{date}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium w-20">Subject:</span>
          <span>{subject}</span>
        </div>
      </div>
    </div>
  );
} 