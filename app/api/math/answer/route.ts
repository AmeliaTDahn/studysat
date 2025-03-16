import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface QuestionOption {
  answer: string;
  is_correct: boolean;
  explanation: string;
}

interface DatabaseQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get the question from the database
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .limit(1);

    if (error) {
      console.error('Error fetching question:', error);
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const question = questions[0] as DatabaseQuestion;
    const selectedOption = question.options.find(opt => opt.answer === answer);

    if (!selectedOption) {
      return NextResponse.json({ 
        correct: false,
        message: 'Invalid answer',
        explanation: 'The selected answer was not found in the options.'
      });
    }

    return NextResponse.json({
      correct: selectedOption.is_correct,
      message: selectedOption.is_correct ? 'Correct!' : 'Incorrect.',
      explanation: selectedOption.explanation
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 