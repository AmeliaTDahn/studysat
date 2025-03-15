import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to normalize answers for comparison
function normalizeAnswer(answer: string): string {
  // Remove whitespace, make lowercase, and remove any special characters
  return answer.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
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
    const { questionId, answer, timeTaken } = body;

    if (!questionId || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the question from the database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer, explanation')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Compare normalized versions of the answers
    const normalizedSubmitted = normalizeAnswer(answer);
    const normalizedCorrect = normalizeAnswer(question.correct_answer);
    const isCorrect = normalizedSubmitted === normalizedCorrect;

    // For debugging
    console.log('Submitted answer:', answer);
    console.log('Correct answer:', question.correct_answer);
    console.log('Normalized submitted:', normalizedSubmitted);
    console.log('Normalized correct:', normalizedCorrect);
    console.log('Is correct:', isCorrect);

    // Store the user's answer
    const { error: answerError } = await supabase
      .from('user_answers')
      .insert({
        user_id: user.id,
        question_id: questionId,
        selected_answer: answer,
        is_correct: isCorrect,
        time_taken: timeTaken || null
      });

    if (answerError) {
      console.error('Error storing answer:', answerError);
      // Continue execution even if storing fails - we still want to give feedback
    }

    return NextResponse.json({
      correct: isCorrect,
      explanation: question.explanation,
      message: isCorrect ? 'Correct! Great job!' : 'Incorrect. Try again!'
    });

  } catch (error) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 