import { NextRequest, NextResponse } from 'next/server';

interface CheckAnswerRequest {
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckAnswerRequest = await request.json();
    const { selectedAnswer, correctAnswer, explanation } = body;

    const isCorrect = selectedAnswer === correctAnswer;

    return NextResponse.json({
      isCorrect,
      feedback: isCorrect ? {
        message: "Correct!",
        explanation
      } : {
        message: "Try again",
        explanation: null
      }
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 