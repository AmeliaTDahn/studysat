import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
    const { text, options, correct_answer, explanation, difficulty, topic } = body;

    // Validate required fields
    if (!text || !options || !correct_answer || !explanation || !difficulty || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    // Validate options format
    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'Options must be a non-empty array' }, { status: 400 });
    }

    // Insert the question into the database
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        text,
        options,
        correct_answer,
        explanation,
        difficulty,
        topic
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

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

    // Get query parameters
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic');
    const difficulty = url.searchParams.get('difficulty');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Build the query
    let query = supabase.from('questions').select('*');

    // Add filters if provided
    if (topic) {
      query = query.eq('topic', topic);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Add limit and order by creation date
    query = query.order('created_at', { ascending: false }).limit(limit);

    // Execute the query
    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 