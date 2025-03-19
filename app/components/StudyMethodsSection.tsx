import React from 'react';

interface StudyMethod {
  method: string;
  application: string;
  rationale: string;
}

interface StudyMethodsSectionProps {
  methods: StudyMethod[];
}

export default function StudyMethodsSection({ methods }: StudyMethodsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-blue-900 mb-4">Study Methods</h3>
      <div className="space-y-6">
        {methods.map((method, index) => (
          <div 
            key={index} 
            className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
          >
            <div className="border-b border-blue-200 pb-3 mb-4">
              <h4 className="text-lg font-semibold text-blue-900">
                {method.method}
              </h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-semibold text-blue-800 mb-2">Step-by-Step Application</h5>
                <div className="text-sm text-blue-700 leading-relaxed pl-4">
                  {method.application.split(/\d+\./).filter(Boolean).map((step, idx) => (
                    <div key={idx} className="flex items-start mb-2">
                      <span className="mr-2">•</span>
                      <span>{step.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {method.rationale && (
                <div className="pt-3 border-t border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2">Why This Method Works</h5>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {method.rationale}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 