"use client";

import React, { useState, useEffect } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

interface Question {
  id: string;
  text: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

interface AnswerResponse {
  correct: boolean;
  explanation: string;
  message: string;
}

export default function MathPractice() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answerResponse, setAnswerResponse] = useState<AnswerResponse | null>(null);

  useEffect(() => {
    fetchNewQuestion();
  }, []);

  const fetchNewQuestion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/math/question');
      const data = await response.json();
      setCurrentQuestion(data);
      setSelectedAnswer('');
      setShowExplanation(false);
    } catch (error) {
      console.error('Error fetching question:', error);
    }
    setLoading(false);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;

    try {
      const response = await fetch('/api/math/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion?.id,
          answer: selectedAnswer,
        }),
      });
      const data = await response.json();
      setAnswerResponse(data);
      setShowExplanation(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 ${poppins.className}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
          SAT Math Practice
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentQuestion ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Question:</h2>
              <p className="text-gray-700">{currentQuestion.text}</p>
            </div>

            {currentQuestion.options && (
              <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-4 rounded-lg border-2 transition duration-200 ${
                      selectedAnswer === option
                        ? showExplanation
                          ? answerResponse?.correct
                            ? 'border-green-600 bg-green-50'
                            : 'border-red-600 bg-red-50'
                          : 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => !showExplanation && setSelectedAnswer(option)}
                    disabled={showExplanation}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {answerResponse && (
              <div className={`mb-6 p-4 rounded-lg ${
                answerResponse.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-medium">{answerResponse.message}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                className={`px-6 py-3 rounded-lg font-medium transition duration-300 ${
                  showExplanation 
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={showExplanation ? fetchNewQuestion : handleAnswerSubmit}
                disabled={!selectedAnswer}
              >
                {showExplanation ? 'Next Question' : 'Submit Answer'}
              </button>
              {!showExplanation && (
                <button
                  className="text-blue-600 font-medium hover:text-blue-800 transition duration-300"
                  onClick={fetchNewQuestion}
                >
                  Skip Question
                </button>
              )}
            </div>

            {showExplanation && currentQuestion.explanation && (
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Explanation:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            Failed to load question. Please try again.
          </div>
        )}
      </div>
    </main>
  );
} 