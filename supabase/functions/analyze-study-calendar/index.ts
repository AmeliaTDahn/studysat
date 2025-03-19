import { createClient } from '@supabase/supabase-js'
import { serve } from 'https://deno.fresh.runtime.dev'
import { corsHeaders, OPENAI_MODEL, STUDY_HOURS, StudyEvent, StudyDocument, StudySession, StudySuggestion, UnavailableTime } from './config.ts'
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_id } = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Get event details with linked documents
    const { data: event, error: eventError } = await supabaseClient
      .from('calendar_events')
      .select(`
        *,
        subjects!inner(*),
        calendar_event_documents(
          importance,
          notes,
          documents(
            id,
            name,
            document_analyses(content_text)
          )
        )
      `)
      .eq('id', event_id)
      .single()

    if (eventError) throw new Error('Error fetching event: ' + eventError.message)
    if (!event) throw new Error('Event not found')

    // Transform linked documents into the expected format
    const linkedDocuments = event.calendar_event_documents?.map(link => ({
      ...link.documents,
      importance: link.importance,
      notes: link.notes
    })) || []

    // Get other available documents for the subject
    const { data: otherDocuments, error: docsError } = await supabaseClient
      .from('documents')
      .select('*, document_analyses(content_text)')
      .eq('subject_id', event.subject_id)
      .not('id', 'in', linkedDocuments.map(d => d.id))

    if (docsError) throw new Error('Error fetching documents: ' + docsError.message)

    // Get user's study sessions
    const { data: studySessions, error: sessionsError } = await supabaseClient
      .from('study_sessions')
      .select('*')
      .eq('subject_id', event.subject_id)
      .eq('session_type', 'focus')
      .order('started_at', { ascending: false })
      .limit(10)

    if (sessionsError) throw new Error('Error fetching study sessions: ' + sessionsError.message)

    // Get user's unavailable times
    const { data: unavailableTimes, error: timesError } = await supabaseClient
      .from('unavailable_times')
      .select('*')
      .eq('user_id', event.user_id)

    if (timesError) throw new Error('Error fetching unavailable times: ' + timesError.message)

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    })

    // Prepare the prompt
    const prompt = {
      role: 'system',
      content: `You are an AI study planner. Analyze the following event and related data to create optimal study suggestions.
      Consider:
      1. Time until the event
      2. Available study materials, with special focus on documents specifically linked to this event
      3. User's past study patterns
      4. Best practices for the type of event

      Document Priority:
      - Prioritize studying materials that are explicitly linked to the event
      - Consider the importance level (1-5) assigned to each linked document
      - Use any notes provided about the linked documents to guide study focus
      - Include other subject documents if time allows and they're relevant

      Time Constraints:
      - Weekdays: Only schedule between ${STUDY_HOURS.WEEKDAY_START} and ${STUDY_HOURS.WEEKDAY_END}
      - Weekends: Available between ${STUDY_HOURS.WEEKEND_START} and ${STUDY_HOURS.WEEKEND_END}
      - Never schedule during user's unavailable times
      - Prefer to schedule study sessions in 25-minute or 50-minute blocks
      - Include short breaks between sessions
      
      Generate study session suggestions that will help the user prepare effectively.
      Each suggestion should include:
      - A specific time and duration that respects the above constraints
      - Which study materials to focus on (prioritizing linked documents)
      - Priority level (1-5, where 5 is highest)
      - Clear explanation of why this session and these materials are important
      
      Format your response as a JSON array of suggestions matching the StudySuggestion interface.
      Ensure all suggested times avoid conflicts with unavailable times provided.`
    }

    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        event: {
          ...event,
          linked_documents: linkedDocuments
        },
        otherDocuments: otherDocuments,
        studySessions: studySessions,
        unavailableTimes: unavailableTimes,
        studyHours: STUDY_HOURS,
        currentTime: new Date().toISOString()
      })
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [prompt, userMessage],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const suggestions = JSON.parse(completion.choices[0].message.content).suggestions

    // Store suggestions in database
    const { data: suggestionIds, error: suggestionsError } = await supabaseClient
      .rpc('generate_ai_calendar_suggestions', {
        event_id: event_id,
        openai_response: suggestions
      })

    if (suggestionsError) throw new Error('Error storing suggestions: ' + suggestionsError.message)

    return new Response(
      JSON.stringify({ success: true, suggestion_ids: suggestionIds }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 