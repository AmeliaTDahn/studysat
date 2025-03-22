import React, { useState } from 'react';
import { Button, Card, Alert, ProgressBar } from '@/components/ui/common';

interface Choice {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface Question {
  text: string;
  choices: Choice[];
  topic: string;
  difficulty: string;
  learningObjective: string;
}

interface QuizComponentProps {
  documents: Array<{
    name: string;
    importance: number;
    notes?: string;
  }>;
}

export default function QuizComponent({ documents }: QuizComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      setQuestions(data.quiz.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuizCompleted(false);
      setScore({ correct: 0, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (choiceIndex: number) => {
    if (selectedAnswer !== null || loading) return;
    
    setSelectedAnswer(choiceIndex);
    setShowExplanation(true);
    
    const isCorrect = questions[currentQuestionIndex].choices[choiceIndex].isCorrect;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizCompleted(false);
    setScore({ correct: 0, total: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <p>{error}</p>
        <Button onClick={generateQuiz} className="mt-4">Try Again</Button>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Practice Quiz</h2>
        <p className="mb-4">Generate a quiz based on your study materials to test your knowledge.</p>
        <Button onClick={generateQuiz} disabled={loading}>
          Generate Quiz
        </Button>
      </Card>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <div className="mb-6">
          <p className="text-lg mb-2">Your Score: {score.correct}/{score.total} ({percentage}%)</p>
          <ProgressBar value={percentage} max={100} className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            />
          </ProgressBar>
        </div>
        <div className="space-y-4">
          <p className="font-medium">
            {percentage >= 90 ? '🌟 Excellent work!' :
             percentage >= 70 ? '👏 Good job!' :
             percentage >= 50 ? '💪 Keep practicing!' :
             '📚 More review needed'}
          </p>
          <Button onClick={handleRestartQuiz} className="mr-4">
            Restart Quiz
          </Button>
          <Button onClick={generateQuiz} variant="outline">
            Generate New Quiz
          </Button>
        </div>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            Score: {score.correct}/{score.total}
          </span>
        </div>
        <ProgressBar value={progress} max={100} className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </ProgressBar>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{currentQuestion.text}</h3>
        <div className="text-sm text-gray-600 mb-4">
          <span className="mr-4">Topic: {currentQuestion.topic}</span>
          <span>Difficulty: {currentQuestion.difficulty}</span>
        </div>
        <p className="text-sm text-gray-600">
          Learning Objective: {currentQuestion.learningObjective}
        </p>
      </div>

      <div className="space-y-3">
        {currentQuestion.choices.map((choice, index) => (
          <Button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={selectedAnswer !== null}
            variant={selectedAnswer === null ? 'outline' : 
                    selectedAnswer === index ? 
                      (choice.isCorrect ? 'success' : 'destructive') :
                      choice.isCorrect ? 'success' : 'outline'}
            className="w-full justify-start text-left p-4"
          >
            {choice.text}
          </Button>
        ))}
      </div>

      {showExplanation && selectedAnswer !== null && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Explanation</h4>
          <p>{currentQuestion.choices[selectedAnswer].explanation}</p>
          <Button
            onClick={handleNextQuestion}
            className="mt-4"
          >
            {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Complete Quiz'}
          </Button>
        </div>
      )}
    </Card>
  );
} 