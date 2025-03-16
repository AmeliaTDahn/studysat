import React, { useState, useEffect } from 'react';

interface Question {
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

interface PracticeQuestionProps {
  topic?: string;
  difficulty?: string;
  onNextQuestion: () => void;
}

// Topic display names
const TOPIC_DISPLAY_NAMES: Record<string, string> = {
  'mathematics': 'Mathematics',
  'science': 'Science',
  'history': 'History',
  'literature': 'Literature',
  'languages': 'Languages',
  'computer_science': 'Computer Science'
};

export default function PracticeQuestion({ topic, difficulty = "medium", onNextQuestion }: PracticeQuestionProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; explanation: string | null } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(topic);

  useEffect(() => {
    // Fetch available topics
    fetch(`/api/topics?difficulty=${difficulty}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch topics');
        return res.json();
      })
      .then(data => setTopics(data))
      .catch(err => {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again later.');
      });
  }, [difficulty]);

  useEffect(() => {
    fetchNewQuestion();
  }, [selectedTopic, difficulty]);

  const fetchNewQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/questions?topic=${selectedTopic || ''}&difficulty=${difficulty}`);
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }
      const data = await response.json();
      if (!data.text) {
        throw new Error('Invalid question data received');
      }
      setQuestion(data);
      setFeedback(null);
      setSelectedAnswer(null);
      setIsCorrect(false);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to load question. Please try again.');
      setQuestion(null);
    }
    setIsLoading(false);
  };

  const checkAnswer = async (answer: string) => {
    if (!question) return;
    
    setSelectedAnswer(answer);
    
    try {
      const response = await fetch('/api/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedAnswer: answer,
          correctAnswer: question.correct_answer,
          explanation: question.explanation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check answer');
      }

      const data = await response.json();
      setFeedback(data.feedback);
      setIsCorrect(data.isCorrect);
    } catch (error) {
      console.error('Error checking answer:', error);
      setError('Failed to check answer. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchNewQuestion}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-red-600">No question available. Please try another topic.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <select 
          value={selectedTopic || ''} 
          onChange={(e) => setSelectedTopic(e.target.value || undefined)}
          className="w-full p-2 border rounded-lg mb-4"
        >
          <option value="">All Topics</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>
              {TOPIC_DISPLAY_NAMES[topic] || topic}
            </option>
          ))}
        </select>
        
        <h2 className="text-2xl font-bold mb-2">{question.text}</h2>
        <p className="text-gray-600">
          Topic: {TOPIC_DISPLAY_NAMES[question.topic] || question.topic} | 
          Difficulty: {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </p>
      </div>
      
      <div className="space-y-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isCorrect && checkAnswer(option)}
            className={`w-full p-4 text-left rounded-lg transition-colors ${
              selectedAnswer === option
                ? isCorrect
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-red-100 border-2 border-red-500'
                : 'bg-gray-100 hover:bg-gray-200'
            } ${isCorrect && option !== selectedAnswer ? 'opacity-50' : ''}`}
            disabled={isCorrect && option !== selectedAnswer}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-6 p-4 rounded-lg ${
          isCorrect ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          <p className="font-bold">{feedback.message}</p>
          {feedback.explanation && (
            <p className="mt-2">{feedback.explanation}</p>
          )}
        </div>
      )}

      {isCorrect && (
        <button
          onClick={() => {
            onNextQuestion();
            fetchNewQuestion();
          }}
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Next Question
        </button>
      )}
    </div>
  );
} 