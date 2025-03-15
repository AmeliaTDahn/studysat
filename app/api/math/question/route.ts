import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return a test question
    const testQuestion = {
      id: "test-1",
      text: "If x + 5 = 10, what is the value of x?",
      options: ["A) 3", "B) 4", "C) 5", "D) 6"],
      correct_answer: "C) 5",
      explanation: "To solve for x, subtract 5 from both sides of the equation:\nx + 5 - 5 = 10 - 5\nx = 5"
    };

    return NextResponse.json(testQuestion);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 