-- Drop existing objects if they exist
drop table if exists public.users cascade;
drop table if exists public.documents cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.subjects cascade;
drop table if exists public.document_analyses cascade;
drop table if exists public.study_statistics cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.ai_calendar_suggestions cascade;
drop table if exists public.calendar_event_documents cascade;
drop table if exists public.study_suggestions cascade;
drop table if exists public.study_methods cascade;
drop table if exists public.ai_generated_study_events cascade;
drop table if exists public.ai_study_methods cascade;
drop function if exists public.handle_updated_at cascade;
drop function if exists public.update_study_statistics cascade;
drop function if exists public.request_document_analysis cascade;
drop function if exists public.generate_ai_calendar_suggestions cascade;

-- Create storage bucket for documents
insert into storage.buckets (id, name, public) 
select 'documents', 'documents', true
where not exists (
  select 1 from storage.buckets where id = 'documents'
);

-- Drop existing storage policies if they exist
drop policy if exists "Users can upload their own documents" on storage.objects;
drop policy if exists "Users can update their own documents" on storage.objects;
drop policy if exists "Users can delete their own documents" on storage.objects;
drop policy if exists "Users can view their own documents" on storage.objects;

-- Set up storage policies for documents bucket
create policy "Users can upload their own documents"
on storage.objects for insert
with check (
  bucket_id = 'documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own documents"
on storage.objects for update
with check (
  bucket_id = 'documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own documents"
on storage.objects for delete
using (
  bucket_id = 'documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own documents"
on storage.objects for select
using (
  bucket_id = 'documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email varchar(255) unique not null,
  full_name varchar(255),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subjects table
create table public.subjects (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add unique constraint to prevent duplicate subjects per user
  unique(name, user_id)
);

-- Create documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  name varchar(255) not null,
  file_url text not null,
  file_type varchar(50) not null,
  file_size integer not null, -- size in bytes
  subject_id uuid references public.subjects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create study_sessions table
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  duration integer not null, -- duration in seconds
  session_type varchar(20) not null check (session_type in ('focus', 'short_break', 'long_break')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create document_analyses table
create table public.document_analyses (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  content_text text,
  status varchar(20) not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Each document should only have one analysis
  unique(document_id)
);

-- Create study_statistics table
create table public.study_statistics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  total_study_time integer not null default 0, -- in seconds
  total_documents integer not null default 0,
  total_subjects integer not null default 0,
  avg_session_length integer not null default 0, -- in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Each user should only have one statistics record
  unique(user_id)
);

-- Function to update study statistics
create or replace function public.update_study_statistics()
returns trigger as $$
declare
  user_stats record;
  total_time integer;
  total_docs integer;
  total_subj integer;
  avg_length integer;
begin
  -- Calculate total study time
  select coalesce(sum(duration), 0) into total_time
  from public.study_sessions
  where user_id = NEW.user_id
  and session_type = 'focus';

  -- Count total documents
  select count(*) into total_docs
  from public.documents
  where user_id = NEW.user_id;

  -- Count total subjects
  select count(*) into total_subj
  from public.subjects
  where user_id = NEW.user_id;

  -- Calculate average session length
  select coalesce(avg(duration)::integer, 0) into avg_length
  from public.study_sessions
  where user_id = NEW.user_id
  and session_type = 'focus';

  -- Insert or update statistics
  insert into public.study_statistics 
    (user_id, total_study_time, total_documents, total_subjects, avg_session_length)
  values 
    (NEW.user_id, total_time, total_docs, total_subj, avg_length)
  on conflict (user_id) 
  do update set 
    total_study_time = EXCLUDED.total_study_time,
    total_documents = EXCLUDED.total_documents,
    total_subjects = EXCLUDED.total_subjects,
    avg_session_length = EXCLUDED.avg_session_length,
    updated_at = timezone('utc'::text, now());

  return NEW;
end;
$$ language plpgsql;

-- Function to request document analysis
create or replace function request_document_analysis(document_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  analysis_id uuid;
  requesting_user_id uuid;
  document_owner_id uuid;
begin
  -- Get the requesting user's ID
  requesting_user_id := auth.uid();
  
  -- Get the document owner's ID
  select user_id into document_owner_id
  from public.documents
  where id = document_id;
  
  -- Check if the requesting user owns the document
  if requesting_user_id != document_owner_id then
    raise exception 'You can only analyze your own documents';
  end if;

  -- Insert or update the analysis record
  insert into public.document_analyses (document_id, status)
  values (document_id, 'pending')
  on conflict (document_id) 
  do update set 
    status = 'pending',
    error_message = null,
    updated_at = timezone('utc'::text, now())
  returning id into analysis_id;

  return analysis_id;
end;
$$;

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.subjects enable row level security;
alter table public.documents enable row level security;
alter table public.study_sessions enable row level security;

-- Create policies for users table
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.users for update 
  using (auth.uid() = id);

create policy "Enable insert for users during signup"
  on public.users for insert
  with check (true);

-- Create policies for subjects table
create policy "Users can view their own subjects"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "Users can create their own subjects"
  on public.subjects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subjects"
  on public.subjects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subjects"
  on public.subjects for delete
  using (auth.uid() = user_id);

-- Create policies for documents table
create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can upload their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Create policies for study_sessions table
create policy "Users can view their own study sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own study sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own study sessions"
  on public.study_sessions for update
  using (auth.uid() = user_id);

-- Enable RLS on document_analyses
alter table public.document_analyses enable row level security;
alter table public.study_statistics enable row level security;

-- Create policies for document_analyses table
create policy "Users can view analyses of their own documents"
  on public.document_analyses for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_analyses.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can update analyses of their own documents"
  on public.document_analyses for update
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_analyses.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Create policies for study_statistics table
create policy "Users can view their own statistics"
  on public.study_statistics for select
  using (auth.uid() = user_id);

create policy "Users can update their own statistics"
  on public.study_statistics for update
  using (auth.uid() = user_id);

create policy "Enable insert for statistics during creation"
  on public.study_statistics for insert
  with check (auth.uid() = user_id);

-- Add triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_subjects_updated_at
  before update on public.subjects
  for each row
  execute function public.handle_updated_at();

create trigger handle_documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

create trigger handle_study_sessions_updated_at
  before update on public.study_sessions
  for each row
  execute function public.handle_updated_at();

create trigger handle_document_analyses_updated_at
  before update on public.document_analyses
  for each row
  execute function public.handle_updated_at();

-- Add triggers to update statistics
create trigger update_stats_on_session_change
  after insert or update or delete on public.study_sessions
  for each row
  execute function public.update_study_statistics();

create trigger update_stats_on_document_change
  after insert or update or delete on public.documents
  for each row
  execute function public.update_study_statistics();

create trigger update_stats_on_subject_change
  after insert or update or delete on public.subjects
  for each row
  execute function public.update_study_statistics();

-- Add helpful comments
comment on table public.users is 'Stores user profile information';
comment on table public.subjects is 'Stores study subjects created by users';
comment on table public.documents is 'Stores uploaded study documents';
comment on table public.study_sessions is 'Tracks study sessions and breaks';

comment on column public.documents.file_type is 'Type of the uploaded file (e.g., pdf, docx, pptx)';
comment on column public.documents.file_size is 'Size of the uploaded file in bytes';
comment on column public.study_sessions.duration is 'Duration of the study session in seconds';
comment on column public.study_sessions.session_type is 'Type of session (focus, short_break, long_break)';
comment on column public.study_sessions.started_at is 'When the study session started';
comment on column public.study_sessions.ended_at is 'When the study session ended';

comment on table public.study_statistics is 'Stores aggregated study statistics for each user';
comment on column public.study_statistics.total_study_time is 'Total time spent studying in seconds';
comment on column public.study_statistics.total_documents is 'Total number of documents uploaded by the user';
comment on column public.study_statistics.total_subjects is 'Total number of subjects created by the user';
comment on column public.study_statistics.avg_session_length is 'Average length of focus sessions in seconds';

-- Create calendar_events table
create table public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  title varchar(255) not null,
  description text,
  event_type varchar(50) not null check (event_type in ('test', 'homework', 'study_session', 'other')),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  all_day boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add trigger for updated_at
create trigger handle_calendar_events_updated_at
  before update on public.calendar_events
  for each row
  execute function public.handle_updated_at();

-- Enable RLS for calendar_events
alter table public.calendar_events enable row level security;

-- Create policies for calendar_events
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can create their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- Create ai_calendar_suggestions table
create table public.ai_calendar_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  original_event_id uuid references public.calendar_events(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  title varchar(255) not null,
  description text,
  priority integer check (priority between 1 and 5),
  recommended_duration interval,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  status varchar(20) default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  ai_explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add trigger for updated_at
create trigger handle_ai_suggestions_updated_at
  before update on public.ai_calendar_suggestions
  for each row
  execute function public.handle_updated_at();

-- Enable RLS for ai_calendar_suggestions
alter table public.ai_calendar_suggestions enable row level security;

-- Create policies for ai_calendar_suggestions
create policy "Users can view their own AI suggestions"
  on public.ai_calendar_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can create their own AI suggestions"
  on public.ai_calendar_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI suggestions"
  on public.ai_calendar_suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI suggestions"
  on public.ai_calendar_suggestions for delete
  using (auth.uid() = user_id);

-- Function to generate AI calendar suggestions
create or replace function generate_ai_calendar_suggestions(
  event_id uuid,
  openai_response json
)
returns setof uuid
language plpgsql
security definer
as $$
declare
  suggestion_id uuid;
  event_record record;
  suggestion json;
begin
  -- Get the event details
  select * into event_record
  from public.calendar_events
  where id = event_id
  and user_id = auth.uid();

  -- Check if event exists and belongs to user
  if event_record is null then
    raise exception 'Event not found or unauthorized';
  end if;

  -- Delete existing pending suggestions for this event
  delete from public.ai_calendar_suggestions
  where original_event_id = event_id
  and status = 'pending';

  -- Insert new suggestions from OpenAI response
  for suggestion in select * from json_array_elements(openai_response)
  loop
    insert into public.ai_calendar_suggestions (
      user_id,
      original_event_id,
      document_id,
      title,
      description,
      priority,
      recommended_duration,
      start_date,
      end_date,
      ai_explanation
    ) values (
      auth.uid(),
      event_id,
      (suggestion->>'document_id')::uuid,
      suggestion->>'title',
      suggestion->>'description',
      (suggestion->>'priority')::integer,
      (suggestion->>'recommended_duration')::interval,
      (suggestion->>'start_date')::timestamp with time zone,
      (suggestion->>'end_date')::timestamp with time zone,
      suggestion->>'ai_explanation'
    )
    returning id into suggestion_id;
    
    return next suggestion_id;
  end loop;
  
  return;
end;
$$;

-- Create calendar_event_documents junction table
create table public.calendar_event_documents (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.calendar_events(id) on delete cascade not null,
  document_id uuid references public.documents(id) on delete cascade not null,
  importance integer check (importance between 1 and 5) default 3, -- How important this document is for the event
  notes text, -- Optional notes about why this document is relevant
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Each document can only be linked once to an event
  unique(event_id, document_id)
);

-- Add trigger for updated_at
create trigger handle_calendar_event_documents_updated_at
  before update on public.calendar_event_documents
  for each row
  execute function public.handle_updated_at();

-- Enable RLS for calendar_event_documents
alter table public.calendar_event_documents enable row level security;

-- Create policies for calendar_event_documents
create policy "Users can view their own event documents"
  on public.calendar_event_documents for select
  using (
    exists (
      select 1 from public.calendar_events
      where calendar_events.id = calendar_event_documents.event_id
      and calendar_events.user_id = auth.uid()
    )
  );

create policy "Users can link documents to their own events"
  on public.calendar_event_documents for insert
  with check (
    exists (
      select 1 from public.calendar_events
      where calendar_events.id = calendar_event_documents.event_id
      and calendar_events.user_id = auth.uid()
    )
  );

create policy "Users can update their own event document links"
  on public.calendar_event_documents for update
  using (
    exists (
      select 1 from public.calendar_events
      where calendar_events.id = calendar_event_documents.event_id
      and calendar_events.user_id = auth.uid()
    )
  );

create policy "Users can remove document links from their own events"
  on public.calendar_event_documents for delete
  using (
    exists (
      select 1 from public.calendar_events
      where calendar_events.id = calendar_event_documents.event_id
      and calendar_events.user_id = auth.uid()
    )
  );

-- Create study_suggestions table
create table public.study_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_date timestamp with time zone not null,
  title varchar(255) not null,
  description text not null,
  suggested_duration integer not null, -- duration in minutes
  documents jsonb not null, -- Store the original documents array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create study_methods table
create table public.study_methods (
  id uuid default gen_random_uuid() primary key,
  suggestion_id uuid references public.study_suggestions(id) on delete cascade not null,
  method varchar(100) not null,
  application text not null,
  rationale text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add triggers for updated_at
create trigger handle_study_suggestions_updated_at
  before update on public.study_suggestions
  for each row
  execute function public.handle_updated_at();

create trigger handle_study_methods_updated_at
  before update on public.study_methods
  for each row
  execute function public.handle_updated_at();

-- Enable RLS for study suggestions tables
alter table public.study_suggestions enable row level security;
alter table public.study_methods enable row level security;

-- Create policies for study_suggestions
create policy "Users can view their own study suggestions"
  on public.study_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can create their own study suggestions"
  on public.study_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own study suggestions"
  on public.study_suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own study suggestions"
  on public.study_suggestions for delete
  using (auth.uid() = user_id);

-- Create policies for study_methods
create policy "Users can view methods for their own suggestions"
  on public.study_methods for select
  using (
    exists (
      select 1 from public.study_suggestions
      where study_suggestions.id = study_methods.suggestion_id
      and study_suggestions.user_id = auth.uid()
    )
  );

create policy "Users can create methods for their own suggestions"
  on public.study_methods for insert
  with check (
    exists (
      select 1 from public.study_suggestions
      where study_suggestions.id = study_methods.suggestion_id
      and study_suggestions.user_id = auth.uid()
    )
  );

create policy "Users can update methods for their own suggestions"
  on public.study_methods for update
  using (
    exists (
      select 1 from public.study_suggestions
      where study_suggestions.id = study_methods.suggestion_id
      and study_suggestions.user_id = auth.uid()
    )
  );

create policy "Users can delete methods for their own suggestions"
  on public.study_methods for delete
  using (
    exists (
      select 1 from public.study_suggestions
      where study_suggestions.id = study_methods.suggestion_id
      and study_suggestions.user_id = auth.uid()
    )
  );

-- Create ai_generated_study_events table
create table public.ai_generated_study_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  title varchar(255) not null,
  overview text not null,
  event_date timestamp with time zone not null,
  duration_minutes integer not null, -- Duration in minutes
  documents jsonb not null, -- Store the relevant documents array
  status varchar(20) default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ai_study_methods table for storing individual study methods
create table public.ai_study_methods (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.ai_generated_study_events(id) on delete cascade not null,
  method_name varchar(100) not null,
  step_by_step_application text not null,
  why_it_works text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add triggers for updated_at
create trigger handle_ai_generated_study_events_updated_at
  before update on public.ai_generated_study_events
  for each row
  execute function public.handle_updated_at();

create trigger handle_ai_study_methods_updated_at
  before update on public.ai_study_methods
  for each row
  execute function public.handle_updated_at();

-- Enable RLS for new tables
alter table public.ai_generated_study_events enable row level security;
alter table public.ai_study_methods enable row level security;

-- Create policies for ai_generated_study_events
create policy "Users can view their own AI generated study events"
  on public.ai_generated_study_events for select
  using (auth.uid() = user_id);

create policy "Users can create their own AI generated study events"
  on public.ai_generated_study_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI generated study events"
  on public.ai_generated_study_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI generated study events"
  on public.ai_generated_study_events for delete
  using (auth.uid() = user_id);

-- Create policies for ai_study_methods
create policy "Users can view methods for their own AI generated events"
  on public.ai_study_methods for select
  using (
    exists (
      select 1 from public.ai_generated_study_events
      where ai_generated_study_events.id = ai_study_methods.event_id
      and ai_generated_study_events.user_id = auth.uid()
    )
  );

create policy "Users can create methods for their own AI generated events"
  on public.ai_study_methods for insert
  with check (
    exists (
      select 1 from public.ai_generated_study_events
      where ai_generated_study_events.id = ai_study_methods.event_id
      and ai_generated_study_events.user_id = auth.uid()
    )
  );

create policy "Users can update methods for their own AI generated events"
  on public.ai_study_methods for update
  using (
    exists (
      select 1 from public.ai_generated_study_events
      where ai_generated_study_events.id = ai_study_methods.event_id
      and ai_generated_study_events.user_id = auth.uid()
    )
  );

create policy "Users can delete methods for their own AI generated events"
  on public.ai_study_methods for delete
  using (
    exists (
      select 1 from public.ai_generated_study_events
      where ai_generated_study_events.id = ai_study_methods.event_id
      and ai_generated_study_events.user_id = auth.uid()
    )
  );

-- Add helpful comments
comment on table public.ai_generated_study_events is 'Stores AI-generated study events with detailed overview information';
comment on table public.ai_study_methods is 'Stores specific study methods associated with AI-generated study events';

-- Function to generate AI study events
create or replace function generate_ai_study_event(
  openai_response json
)
returns uuid
language plpgsql
security definer
as $$
declare
  event_id uuid;
  study_method json;
begin
  -- Insert the main event
  insert into public.ai_generated_study_events (
    user_id,
    subject_id,
    title,
    overview,
    event_date,
    duration_minutes,
    documents,
    status
  ) values (
    auth.uid(),
    (openai_response->>'subject_id')::uuid,
    openai_response->>'title',
    openai_response->>'overview',
    (openai_response->>'event_date')::timestamp with time zone,
    (openai_response->>'duration_minutes')::integer,
    openai_response->'documents',
    'pending'
  )
  returning id into event_id;

  -- Insert study methods
  for study_method in select * from json_array_elements(openai_response->'study_methods')
  loop
    insert into public.ai_study_methods (
      event_id,
      method_name,
      step_by_step_application,
      why_it_works
    ) values (
      event_id,
      study_method->>'method_name',
      study_method->>'step_by_step_application',
      study_method->>'why_it_works'
    );
  end loop;

  return event_id;
end;
$$; 