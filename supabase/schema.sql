-- Drop existing objects if they exist
drop table if exists public.users cascade;
drop table if exists public.documents cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.subjects cascade;
drop function if exists public.handle_updated_at cascade;

-- Create storage bucket for documents
insert into storage.buckets (id, name, public) 
values ('documents', 'documents', true);

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