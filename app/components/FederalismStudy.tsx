import React from 'react';
import { Dialog } from '@headlessui/react';
import { FaCalendar } from 'react-icons/fa';

interface FederalismStudyProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  subject: string;
}

export default function FederalismStudy({
  isOpen,
  onClose,
  date,
  subject
}: FederalismStudyProps) {
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Understanding Federalism: State vs. Federal Powers
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
              <span>March 23, 2025</span>
              <span className="mx-2">•</span>
              <span>History</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Learning Objectives */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Learning Objectives</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                    <span className="text-blue-800 text-sm">1</span>
                  </div>
                  <span className="text-blue-900">Distinguish between powers reserved to states and those delegated to the federal government</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                    <span className="text-blue-800 text-sm">2</span>
                  </div>
                  <span className="text-blue-900">Apply concepts of federalism to contemporary policy issues</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                    <span className="text-blue-800 text-sm">3</span>
                  </div>
                  <span className="text-blue-900">Critically evaluate the impact of federalism on diversity of policies among states</span>
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Overview</h3>
              <div className="space-y-3 text-gray-700">
                <p>Key topics include:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>The Tenth Amendment</li>
                  <li>Commerce clause</li>
                  <li>Federal grants and mandates</li>
                  <li>Case studies on health care and education</li>
                </ul>
                <p>This session connects to previous discussions on the structure of government and sets the stage for exploring specific policy areas.</p>
                <p>Federalism is crucial for understanding the balance of power in the U.S. and how it allows for policy experimentation.</p>
                <p className="font-medium mt-4">Expected outcome: Clear understanding of federalism principles and their application in real-world scenarios.</p>
              </div>
            </div>

            {/* Study Methods */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Study Methods</h3>
              <div className="space-y-6">
                {/* Method 1 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Elaboration + Spaced Practice</h4>
                  <div className="ml-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Step-by-Step Application:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Create a chart comparing state and federal responsibilities in key policy areas</li>
                      <li>For each area, write a brief explanation of why it's primarily state or federal</li>
                      <li>Review this chart in one week, then again in a month, elaborating on examples from current events</li>
                    </ol>
                    <p className="text-sm text-gray-500 mt-3">Why This Method Works: Elaboration helps connect new information to what you already know, making it more memorable. Spaced practice reinforces learning over time, preventing forgetting.</p>
                  </div>
                </div>

                {/* Method 2 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Self-Testing + Summary Creation</h4>
                  <div className="ml-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Step-by-Step Application:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Write down questions based on the federalism principles covered</li>
                      <li>Attempt to answer these without looking at your notes</li>
                      <li>Summarize the key points of federalism and its impact on policy diversity in your own words</li>
                    </ol>
                    <p className="text-sm text-gray-500 mt-3">Why This Method Works: Self-testing identifies knowledge gaps, while summarizing consolidates understanding and aids in long-term retention.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between px-6 py-4 border-t border-gray-200">
            <button
              className="text-red-600 hover:text-red-700 font-medium"
              onClick={onClose}
            >
              Delete Event
            </button>
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