import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const testQuestions = [
  {
    text: "If x + 5 = 10, what is the value of x?",
    options: [
      {
        answer: "3",
        is_correct: false,
        explanation: "If x were 3, then x + 5 would be 8, not 10."
      },
      {
        answer: "4",
        is_correct: false,
        explanation: "If x were 4, then x + 5 would be 9, not 10."
      },
      {
        answer: "5",
        is_correct: true,
        explanation: "When x = 5, then x + 5 = 10, which satisfies the equation."
      },
      {
        answer: "6",
        is_correct: false,
        explanation: "If x were 6, then x + 5 would be 11, not 10."
      }
    ],
    correct_answer: "5",
    explanation: "To solve for x, subtract 5 from both sides of the equation:\nx + 5 - 5 = 10 - 5\nx = 5",
    difficulty: "easy",
    topic: "linear_equations"
  },
  {
    text: "What is the slope of the line that passes through the points (2, 4) and (5, 10)?",
    options: [
      {
        answer: "1",
        is_correct: false,
        explanation: "This would mean the line rises 1 unit for every 1 unit to the right, which is incorrect."
      },
      {
        answer: "2",
        is_correct: true,
        explanation: "The slope is (10 - 4)/(5 - 2) = 6/3 = 2, which means the line rises 2 units for every 1 unit to the right."
      },
      {
        answer: "3",
        is_correct: false,
        explanation: "This would mean the line rises 3 units for every 1 unit to the right, which is incorrect."
      },
      {
        answer: "4",
        is_correct: false,
        explanation: "This would mean the line rises 4 units for every 1 unit to the right, which is incorrect."
      }
    ],
    correct_answer: "2",
    explanation: "The slope can be calculated using the formula: (y₂ - y₁)/(x₂ - x₁)\nIn this case: (10 - 4)/(5 - 2) = 6/3 = 2",
    difficulty: "medium",
    topic: "linear_equations"
  },
  {
    text: "Solve the quadratic equation: x² + 6x + 9 = 0",
    options: [
      {
        answer: "x = -3",
        is_correct: true,
        explanation: "This is a perfect square trinomial: (x + 3)² = 0, so x = -3 is the only solution."
      },
      {
        answer: "x = 3",
        is_correct: false,
        explanation: "If x were 3, then x² + 6x + 9 would equal 9 + 18 + 9 = 36, not 0."
      },
      {
        answer: "x = -3 or x = 3",
        is_correct: false,
        explanation: "This equation has only one solution because it's a perfect square trinomial."
      },
      {
        answer: "No solution",
        is_correct: false,
        explanation: "The equation does have a solution: x = -3."
      }
    ],
    correct_answer: "x = -3",
    explanation: "This is a perfect square trinomial: x² + 6x + 9 = (x + 3)²\nSetting equal to zero: (x + 3)² = 0\nTaking the square root: x + 3 = 0\nSolving for x: x = -3",
    difficulty: "hard",
    topic: "quadratic_equations"
  }
];

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Insert test questions
    const { data: questions, error } = await supabase
      .from('questions')
      .insert(testQuestions)
      .select();

    if (error) {
      console.error('Error seeding questions:', error);
      return NextResponse.json({ error: 'Failed to seed questions' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully seeded questions',
      questions
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 