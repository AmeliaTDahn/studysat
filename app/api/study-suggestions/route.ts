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
    const { documents, eventDate } = await request.json();

    if (!documents || !Array.isArray(documents) || !eventDate) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Create the prompt
    const documentsContext = documents.map(doc => 
      `- ${doc.name} (Importance: ${doc.importance}/5)${doc.notes ? ` - Notes: ${doc.notes}` : ''}`
    ).join('\n');

    const systemPrompt = `You are a study planning assistant that creates efficient and comprehensive study events based on cognitive science research.
Your goal is to ensure all materials are covered effectively using evidence-based learning strategies.

Break down the materials into logical chunks, but avoid over-segmentation - combine related concepts that can be studied together efficiently.
Your response must be a valid JSON object with a 'suggestions' array containing study events.
Each study event must have exactly these fields:
- title: string (specific and actionable title that clearly states what will be studied)
- description: string (detailed explanation that MUST include this exact format:
  Learning objectives:
  (1) [First objective written as a measurable outcome]
  (2) [Second objective written as a measurable outcome]
  (3) [Third objective written as a measurable outcome]
  
  Then followed by:
  • Key topics/concepts to be covered
  • How this connects to previous knowledge
  • Why these topics are important
  • Expected outcomes after completing the session)
- suggestedDuration: number (duration in minutes, flexible based on content volume)
- studyMethods: array of objects containing:
  - method: string (name of the study method)
  - application: string (detailed step-by-step instructions for applying this method to the specific content)
  - rationale: string (explain why this method is particularly effective for these specific topics/concepts)

IMPORTANT: Every study event description MUST start with "Learning objectives:" followed by numbered objectives in parentheses. Each objective must be specific, measurable, and relevant to the content being studied.

Incorporate these evidence-based learning strategies:
1. Retrieval Practice: Active recall through self-testing, flashcards, teaching others
   • Include specific questions to ask yourself
   • Suggest flashcard content
   • Outline key points to teach others
2. Spaced Practice: Schedule reviews at increasing intervals
   • Suggest specific review points (e.g., "Quick review of X before starting Y")
   • Recommend follow-up review schedule
3. Interleaved Practice: Mix different types of problems or topics
   • Specify which topics to interleave
   • Explain how they connect
4. Elaboration: Connect new information to existing knowledge
   • Provide specific examples of connections
   • Suggest analogies or metaphors
5. Dual Coding: Combine verbal and visual learning
   • Suggest specific diagrams to create
   • Recommend visualization exercises
6. Concrete Examples: Use real-world applications
   • Include multiple diverse examples
   • Explain why each example is relevant
7. Self-Testing: Regular knowledge checks
   • Provide sample questions
   • Suggest practice problems
8. Summary Creation: Condensing information in your own words
   • Outline key points to include
   • Suggest different summary formats (mind maps, bullet points, etc.)

Important Guidelines:
1. Ensure all materials are covered efficiently and thoroughly
2. Allocate time proportionally to content volume and complexity
3. Combine related concepts that can be studied together effectively
4. Consider material importance when determining session depth
5. Recommend specific study techniques based on content type
6. Include active recall and self-testing components
7. Suggest ways to space and interleave practice
8. Provide concrete examples of how to apply each study method
9. Break longer sessions into focused segments with clear transitions
10. Include preparation steps and materials needed
11. Suggest ways to track progress and verify understanding
12. Recommend follow-up activities to reinforce learning`;

    const userPrompt = `Create an efficient study plan for an event on ${new Date(eventDate).toLocaleDateString()}.
The plan should cover all materials while incorporating evidence-based learning strategies:

Available study materials:
${documentsContext}

Requirements:
1. Cover all materials but combine related concepts when practical
2. Allocate study time based on:
   - Content volume (don't spend 30 minutes on a single page)
   - Material complexity
   - Importance rating
3. Each session should have:
   - Clear, specific learning objectives
   - Detailed breakdown of topics to cover
   - Multiple study methods tailored to the content
   - Active recall components with example questions
   - Self-testing opportunities with specific exercises
   - Preparation steps and required materials
   - Progress tracking suggestions
4. Explain in detail:
   - The value and purpose of each study session
   - How topics connect to each other
   - Why specific methods were chosen
   - Expected outcomes and success criteria
5. Session duration guidelines:
   - 15-30 minutes for smaller/simpler content
   - 30-50 minutes for larger/complex content
   - Include suggested breaks and transition activities
   - Break longer sessions into focused segments

Format your response as a JSON object with a 'suggestions' array. Example format:
{
  "suggestions": [
    {
      "title": "Master Constitutional Principles: Separation of Powers",
      "description": "Learning objectives:
(1) Explain the distinct roles and responsibilities of each branch of government with 90% accuracy
(2) Analyze at least 3 key checks and balances between branches using historical examples
(3) Evaluate the effectiveness of separation of powers using modern case studies

Key topics include: executive powers, legislative process, judicial review, and inter-branch relationships. This session builds on previous understanding of government structure and prepares for upcoming study of specific powers. The separation of powers is fundamental to understanding how the U.S. government functions and prevents the concentration of power. Expected outcome: Ability to explain and analyze how the three branches interact and balance each other's power.",
      "suggestedDuration": 45,
      "studyMethods": [
        {
          "method": "Dual Coding + Retrieval Practice",
          "application": "1. Create a detailed diagram showing the three branches and their relationships: Draw each branch as a circle, connect with arrows showing checks and balances. 2. Without looking at notes, fill in specific powers and checks for each branch. 3. Add color coding to group similar types of powers (e.g., red for emergency powers, blue for everyday functions).",
          "rationale": "Combining visual mapping with active recall strengthens understanding of complex relationships between branches. The color coding helps identify patterns in types of governmental powers."
        },
        {
          "method": "Concrete Examples + Self-Testing",
          "application": "1. List three historical examples for each type of check and balance (e.g., presidential vetoes, Supreme Court decisions, Congressional oversight). 2. Create practice scenarios: 'If Congress passes a law that the President believes is unconstitutional, what can each branch do?' 3. Explain each example's significance and outcome.",
          "rationale": "Real examples make abstract concepts concrete and memorable. Practice scenarios develop critical thinking about inter-branch dynamics."
        }
      ]
    }
  ]
}

Note: Balance thoroughness with efficiency - don't create separate sessions for small amounts of related content.`;

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

    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response format from OpenAI');
    }

    // Validate each suggestion
    parsedResponse.suggestions = parsedResponse.suggestions.map(suggestion => ({
      title: String(suggestion.title || ''),
      description: String(suggestion.description || ''),
      suggestedDuration: Number(suggestion.suggestedDuration) || 30,
      studyMethods: Array.isArray(suggestion.studyMethods) ? suggestion.studyMethods.map(method => ({
        method: String(method.method || ''),
        application: String(method.application || ''),
        rationale: String(method.rationale || '')
      })) : []
    }));

    // Store suggestions in the database
    const storedSuggestions = await Promise.all(
      parsedResponse.suggestions.map(async (suggestion) => {
        // First store the main suggestion
        const { data: storedSuggestion, error: suggestionError } = await supabase
          .from('study_suggestions')
          .insert({
            user_id: session.user.id,
            event_date: eventDate,
            title: suggestion.title,
            description: suggestion.description,
            suggested_duration: suggestion.suggestedDuration,
            documents: documents // Store the original documents for reference
          })
          .select()
          .single();

        if (suggestionError) {
          console.error('Error storing suggestion:', suggestionError);
          throw new Error('Failed to store study suggestion');
        }

        // Then store the study methods for this suggestion
        if (suggestion.studyMethods && suggestion.studyMethods.length > 0) {
          const { error: methodsError } = await supabase
            .from('study_methods')
            .insert(
              suggestion.studyMethods.map(method => ({
                suggestion_id: storedSuggestion.id,
                method: method.method,
                application: method.application,
                rationale: method.rationale
              }))
            );

          if (methodsError) {
            console.error('Error storing study methods:', methodsError);
            throw new Error('Failed to store study methods');
          }
        }

        return {
          ...storedSuggestion,
          studyMethods: suggestion.studyMethods
        };
      })
    );

    return NextResponse.json({ suggestions: storedSuggestions });
  } catch (error) {
    console.error('Error in study suggestions API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate study suggestions' },
      { status: 500 }
    );
  }
} 