import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

interface StudyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  title: string;
  date: string;
  subject: string;
  learningObjectives: string[];
  overview: string;
  studyMethods: {
    method: string;
    application: string[];
    rationale: string;
  }[];
}

export default function StudyEventModal({
  isOpen,
  onClose,
  onDelete,
  title,
  date,
  subject,
  learningObjectives,
  overview,
  studyMethods
}: StudyEventModalProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose}
        className="relative z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

        {/* Full-screen container for centering */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                {title}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Overview Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <FaCalendarAlt />
                  <span>{format(new Date(date), 'MMMM d, yyyy')}</span>
                  {subject && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{subject}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mb-8 bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Learning Objectives
                </h3>
                <ul className="space-y-3">
                  {learningObjectives.map((objective, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-3 text-blue-800"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-200 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Overview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Overview
                </h3>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {overview}
                  </p>
                </div>
              </div>

              {/* Study Methods */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Study Methods
                </h3>
                {studyMethods.map((method, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-100"
                  >
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      {method.method}
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">
                          Step-by-Step Application
                        </h5>
                        <ul className="space-y-2">
                          {method.application.map((step, stepIndex) => (
                            <li 
                              key={stepIndex}
                              className="flex items-start gap-2 text-gray-600"
                            >
                              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium text-blue-800">
                                {stepIndex + 1}
                              </span>
                              <span className="text-sm leading-5">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Why This Method Works
                        </h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {method.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <FaTrash />
                Delete Event
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        className="relative z-[60]"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Delete Event
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 