import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaFileAlt, FaBookOpen, FaCalendar, FaLightbulb, FaClipboardList } from 'react-icons/fa';
import StudyMaterialGenerator from './StudyMaterialGenerator';
import StudySummary from './StudySummary';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  subject_name: string | null;
  documents: Array<{
    id: string;
    name: string;
    content_text?: string;
    importance?: number;
    notes?: string;
  }>;
}

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onGenerate: (eventId: string) => void;
  formatDate: (date: string) => string;
}

export default function StudySessionModal({
  isOpen,
  onClose,
  event,
  onGenerate,
  formatDate
}: StudySessionModalProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'summary'>('materials');

  if (!event) return null;

  const objectives = event.description
    ? event.description
        .split('Learning objectives:')[1]
        .split('\n\n')[0]
        .split(/\(\d+\)/)
        .filter(obj => obj.trim())
    : [];

  const overview = event.description
    ? event.description
        .split('Learning objectives:')[1]
        .split('\n\n')
        .slice(1)
        .join('\n\n')
        .split('Study Methods:')[0]
        .trim()
    : '';

  const studyMethods = event.description?.includes('Study Methods:')
    ? event.description
        .split('Study Methods:')[1]
        .split('---')
        .map(method => {
          const [methodName, ...details] = method.trim().split('\n');
          const applicationStart = details.indexOf('Step-by-Step Application:');
          const rationaleStart = details.indexOf('Why This Method Works:');
          
          return {
            name: methodName.trim(),
            application: details
              .slice(applicationStart + 1, rationaleStart)
              .filter(line => line.trim().startsWith('•'))
              .map(line => line.trim().substring(2)),
            rationale: details
              .slice(rationaleStart + 1)
              .join('\n')
              .trim()
          };
        })
        .filter(method => method.name && method.application.length > 0) // Only keep methods with a name and steps
    : [];

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg flex flex-col max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {event.title}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <FaCalendar className="text-gray-400" />
              <span>{formatDate(event.event_date)}</span>
              {event.subject_name && (
                <>
                  <span className="mx-2">•</span>
                  <span>{event.subject_name}</span>
                </>
              )}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Learning Objectives */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Learning Objectives</h3>
              <div className="space-y-2">
                {objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                      <span className="text-blue-800 text-sm">{index + 1}</span>
                    </div>
                    <span className="text-blue-900">{objective}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Overview</h3>
              <div className="space-y-3 text-gray-700">
                {overview.split('. ').map((sentence, index) => (
                  <p key={index}>{sentence.trim()}.</p>
                ))}
              </div>
            </div>

            {/* Study Methods */}
            {studyMethods.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Study Methods</h3>
                {studyMethods.map((method, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaLightbulb className="text-gray-500" />
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                    </div>
                    <div className="ml-8">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Step-by-Step Application:</h5>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        {method.application.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                      <p className="text-sm text-gray-500 mt-3">
                        Why This Method Works: {method.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Study Materials Section */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FaClipboardList className="text-gray-600" />
                <h3 className="font-medium text-gray-900">Study Materials</h3>
              </div>
              <div className="space-y-4">
                <StudyMaterialGenerator
                  event={event}
                  onGenerate={onGenerate}
                />
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex justify-between px-6 py-4 border-t border-gray-200 bg-white">
            <button
              className="text-gray-600 hover:text-gray-700 font-medium"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 