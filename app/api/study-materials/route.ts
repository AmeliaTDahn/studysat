import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  console.log('Received study materials generation request');
  
  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { eventId, documents } = body;

    if (!eventId || !documents) {
      console.error('Missing required fields:', { eventId, documents });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!documents.length) {
      console.error('No documents provided');
      return NextResponse.json(
        { error: 'No documents provided for summarization' },
        { status: 400 }
      );
    }

    // Validate document content
    const validDocuments = documents.filter(doc => doc.content && typeof doc.content === 'string');
    if (validDocuments.length === 0) {
      console.error('No valid document content found');
      return NextResponse.json(
        { error: 'No valid document content found' },
        { status: 400 }
      );
    }

    console.log('Generating summary for documents:', validDocuments.length);

    // Generate study summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert study material generator. Create a comprehensive and well-structured study summary."
        },
        {
          role: "user",
          content: `Create a comprehensive study summary that includes:
          1. Main concepts and key points
          2. Important definitions and terminology
          3. Examples and applications
          4. Key takeaways
          
          Format the summary in markdown with clear headings and bullet points.
          
          Content to summarize:
          ${validDocuments.map(doc => doc.content).join('\n\n')}`
        }
      ]
    });

    console.log('OpenAI response received');
    const summary = completion.choices[0].message.content;

    if (!summary) {
      console.error('No summary generated from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate summary content' },
        { status: 500 }
      );
    }

    console.log('Summary generated successfully');
    return NextResponse.json({ 
      success: true,
      summary 
    });
  } catch (error) {
    console.error('Error in study materials generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate study summary' },
      { status: 500 }
    );
  }
} 