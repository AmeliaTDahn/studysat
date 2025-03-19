import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { eventDate: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch suggestions for the given date
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('study_suggestions')
      .select(`
        *,
        study_methods (*)
      `)
      .eq('user_id', session.user.id)
      .eq('event_date', params.eventDate)
      .order('created_at', { ascending: false });

    if (suggestionsError) {
      console.error('Error fetching suggestions:', suggestionsError);
      return NextResponse.json(
        { error: 'Failed to fetch study suggestions' },
        { status: 500 }
      );
    }

    // Map database fields to frontend interface
    const mappedSuggestions = suggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      suggestedDuration: Number(suggestion.suggested_duration),
      studyMethods: suggestion.study_methods?.map(method => ({
        method: method.method,
        application: method.application,
        rationale: method.rationale
      })) || []
    }));

    return NextResponse.json({ suggestions: mappedSuggestions });
  } catch (error) {
    console.error('Error in GET study suggestions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch study suggestions' },
      { status: 500 }
    );
  }
} 