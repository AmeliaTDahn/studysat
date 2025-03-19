import React from 'react';

interface OverviewProps {
  description: string;
}

export default function Overview({ description }: OverviewProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-blue-900 mb-4">Overview</h3>
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </div>
    </div>
  );
} 