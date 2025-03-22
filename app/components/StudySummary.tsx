import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaBookOpen, FaLightbulb, FaBullseye, FaQuestion } from 'react-icons/fa';

interface PracticeQuestion {
  question: string;
  answer: string;
}

interface StudySummary {
  id: string;
  title: string;
  summary_content: string;
  key_concepts: string[];
  learning_objectives: string[];
  practice_questions: PracticeQuestion[];
}

interface StudySummaryProps {
  sessionId: string;
}

export default function StudySummary({ sessionId }: StudySummaryProps) {
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSummary() {
      try {
        // First try to fetch existing summary
        const { data: existingSummary, error: fetchError } = await supabase
          .from('study_summaries')
          .select('*')
          .eq('study_session_id', sessionId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw fetchError;
        }

        if (existingSummary) {
          setSummary(existingSummary);
          setLoading(false);
          return;
        }

        // If no existing summary, generate a new one
        const response = await fetch('/api/study-summaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate study summary');
        }

        const { summary: newSummary } = await response.json();
        setSummary(newSummary);

      } catch (err) {
        console.error('Error fetching study summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to load study summary');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSummary();
    }
  }, [sessionId, supabase]);

  const toggleAnswer = (index: number) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-gray-500 p-4">
        <p>No study summary available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-white rounded-xl shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaBookOpen className="text-blue-500" />
          {summary.title}
        </h2>
        <div className="prose max-w-none">
          {summary.summary_content.split('\n').map((paragraph, idx) => (
            <p key={idx} className="text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaLightbulb className="text-yellow-500" />
          Key Concepts
        </h3>
        <ul className="list-disc list-inside space-y-2">
          {summary.key_concepts.map((concept, idx) => (
            <li key={idx} className="text-gray-700">{concept}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaBullseye className="text-green-500" />
          Learning Objectives
        </h3>
        <ul className="list-disc list-inside space-y-2">
          {summary.learning_objectives.map((objective, idx) => (
            <li key={idx} className="text-gray-700">{objective}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaQuestion className="text-purple-500" />
          Practice Questions
        </h3>
        <div className="space-y-4">
          {summary.practice_questions.map((qa, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <p className="font-medium text-gray-900 mb-2">{qa.question}</p>
              <div className="mt-2">
                <button
                  onClick={() => toggleAnswer(idx)}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  {revealedAnswers.has(idx) ? 'Hide Answer' : 'Show Answer'}
                </button>
                {revealedAnswers.has(idx) && (
                  <p className="mt-2 text-gray-700">{qa.answer}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 