import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { documents } = await request.json();

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Create the prompt
    const documentsContext = documents.map(doc => 
      `- ${doc.name} (Importance: ${doc.importance}/5)${doc.notes ? ` - Notes: ${doc.notes}` : ''}`
    ).join('\n');

    const systemPrompt = `You are a quiz generation assistant that creates high-quality practice questions based on study materials.
Your goal is to create questions that test understanding and help reinforce learning.

Your response must be a valid JSON object with a 'questions' array containing quiz questions.
Each question must have exactly these fields:
- text: string (the question text)
- choices: array of objects containing:
  - text: string (the answer choice text)
  - isCorrect: boolean (whether this is the correct answer)
  - explanation: string (explanation of why this answer is correct/incorrect)
- topic: string (the main topic this question covers)
- difficulty: string (one of: "easy", "medium", "hard")
- learningObjective: string (what specific knowledge/skill this tests)

Guidelines for creating questions:
1. Create a mix of question types:
   - Recall questions to test basic knowledge
   - Application questions to test understanding
   - Analysis questions to test deeper comprehension
2. Ensure questions are clear and unambiguous
3. Make all answer choices plausible
4. Include detailed explanations for both correct and incorrect answers
5. Cover different aspects of the material
6. Vary the difficulty level
7. Focus on important concepts from the materials
8. Use proper terminology from the field
9. Make questions engaging and relevant
10. Ensure questions build on each other when appropriate

Format your response as a JSON object with a 'questions' array. Example format:
{
  "questions": [
    {
      "text": "What is the primary function of mitochondria in cells?",
      "choices": [
        {
          "text": "Energy production through cellular respiration",
          "isCorrect": true,
          "explanation": "Mitochondria are known as the powerhouse of the cell because they produce ATP through cellular respiration, providing energy for cellular processes."
        },
        {
          "text": "Protein synthesis",
          "isCorrect": false,
          "explanation": "Protein synthesis occurs in ribosomes, not mitochondria. This is a common misconception."
        }
      ],
      "topic": "Cell Biology",
      "difficulty": "medium",
      "learningObjective": "Understand the role of mitochondria in cellular energy production"
    }
  ]
}`;

    const userPrompt = `Create a practice quiz based on these study materials:

${documentsContext}

Requirements:
1. Generate 5-10 questions covering the key concepts
2. Ensure questions test different levels of understanding
3. Include a mix of difficulties
4. Focus on the most important concepts (based on importance ratings)
5. Make questions specific to the actual content
6. Include detailed explanations for all answer choices
7. Ensure all questions are directly relevant to the materials provided`;

    console.log('Calling OpenAI with prompts:', { systemPrompt, userPrompt });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    console.log('OpenAI response:', content);

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response format from OpenAI');
    }

    // Validate each question
    parsedResponse.questions = parsedResponse.questions.map(question => ({
      text: String(question.text || ''),
      choices: Array.isArray(question.choices) ? question.choices.map(choice => ({
        text: String(choice.text || ''),
        isCorrect: Boolean(choice.isCorrect),
        explanation: String(choice.explanation || '')
      })) : [],
      topic: String(question.topic || ''),
      difficulty: String(question.difficulty || 'medium'),
      learningObjective: String(question.learningObjective || '')
    }));

    // Store quiz in the database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: session.user.id,
        documents: documents,
        questions: parsedResponse.questions
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error storing quiz:', quizError);
      throw new Error('Failed to store quiz');
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error in quiz generation API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
} 