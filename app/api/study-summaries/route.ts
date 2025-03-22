import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get study session details with subject and documents
    const { data: studySession, error: sessionError } = await supabase
      .from('study_sessions')
      .select(`
        *,
        subjects!inner(name),
        study_session_documents!inner(
          documents!inner(
            id,
            name,
            document_analyses(content_text)
          )
        )
      `)
      .eq('id', session_id)
      .single();

    if (sessionError || !studySession) {
      return NextResponse.json(
        { error: 'Failed to fetch study session' },
        { status: 404 }
      );
    }

    // Prepare documents context
    const documentsContext = studySession.study_session_documents
      .map(link => {
        const doc = link.documents;
        const analysis = doc.document_analyses?.[0];
        return `Document: ${doc.name}
Content: ${analysis?.content_text || 'No content analysis available'}
---`;
      })
      .join('\n\n');

    // Generate study summary using OpenAI
    const prompt = `Create a comprehensive study summary by analyzing and combining the following documents:

${documentsContext}

Requirements:
1. Create a concise but informative title for this study summary
2. Generate a well-structured summary that:
   - Combines related concepts across documents
   - Highlights key relationships and dependencies
   - Explains complex topics clearly
   - Uses examples where helpful
3. Extract key concepts (as a list)
4. Create specific learning objectives (as a list)
5. Generate practice questions with answers to test understanding

Format your response as a JSON object with this structure:
{
  "title": "string",
  "summary_content": "string",
  "key_concepts": ["string"],
  "learning_objectives": ["string"],
  "practice_questions": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert study guide creator, skilled at combining and summarizing educational materials into clear, comprehensive study guides."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('Failed to generate study summary');
    }

    const parsedResponse = JSON.parse(response);

    // Store the summary in the database
    const { data: storedSummary, error: summaryError } = await supabase
      .rpc('generate_study_summary', {
        session_id,
        openai_response: parsedResponse
      });

    if (summaryError) {
      throw new Error('Failed to store study summary');
    }

    return NextResponse.json({
      summary: {
        id: storedSummary,
        ...parsedResponse
      }
    });

  } catch (error) {
    console.error('Error generating study summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate study summary' },
      { status: 500 }
    );
  }
} 